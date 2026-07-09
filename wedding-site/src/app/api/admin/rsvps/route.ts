import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

type FirestoreTimestamp = {
  toDate: () => Date;
};

type MemberData = {
  fullName?: string;
  attendingWedding?: boolean;
  attendingChurch?: boolean;
  churchEligible?: boolean;
  unableToAttend?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  rsvpStatus?: string;
  submittedAt?: FirestoreTimestamp;
};

type FamilyData = {
  surname?: string;
  familyNameKey?: string;
  guestGroup?: "bride-groom" | "parents";
  contactEmail?: string;
  contactPhone?: string;
  rsvpStatus?: string;
  churchSeatLimit?: number;
  churchSeatsUsed?: number;
  submittedAt?: FirestoreTimestamp;
};

function timestampToISOString(timestamp?: FirestoreTimestamp) {
  if (!timestamp) return null;

  return timestamp.toDate().toISOString();
}

export async function GET() {
  try {
    const familiesSnapshot = await adminDb.collection("families").get();

    const families = await Promise.all(
      familiesSnapshot.docs.map(async (familyDoc) => {
        const familyData = familyDoc.data() as FamilyData;
        const membersSnapshot = await familyDoc.ref.collection("members").get();

        const members = membersSnapshot.docs.map((memberDoc) => {
          const memberData = memberDoc.data() as MemberData;

          return {
            id: memberDoc.id,
            fullName: memberData.fullName ?? "",
            attendingWedding: Boolean(memberData.attendingWedding),
            attendingChurch: false,
            churchEligible: memberData.churchEligible !== false,
            unableToAttend: Boolean(memberData.unableToAttend),
            contactEmail: memberData.contactEmail ?? "",
            contactPhone: memberData.contactPhone ?? "",
            rsvpStatus: memberData.rsvpStatus ?? "pending",
            submittedAt: timestampToISOString(memberData.submittedAt),
          };
        });

        return {
          id: familyDoc.id,
          surname: familyData.surname ?? familyDoc.id,
          familyNameKey: familyData.familyNameKey ?? familyDoc.id,
          guestGroup: familyData.guestGroup ?? "bride-groom",
          contactEmail: familyData.contactEmail ?? "",
          contactPhone: familyData.contactPhone ?? "",
          rsvpStatus: familyData.rsvpStatus ?? "pending",
          submittedAt: timestampToISOString(familyData.submittedAt),
          churchSeatLimit: familyData.churchSeatLimit ?? 0,
          churchSeatsUsed: familyData.churchSeatsUsed ?? 0,
          members,
        };
      })
    );

    const totals = families.reduce(
      (summary, family) => {
        const invited = family.members.length;
        const reception = family.members.filter(
          (member) => member.attendingWedding
        ).length;
        const unableToAttend = family.members.filter(
          (member) => member.unableToAttend
        ).length;
        const submittedGuests = family.members.filter(
          (member) => member.rsvpStatus === "submitted"
        ).length;
        const missingPhones = family.members.filter(
          (member) => member.rsvpStatus === "submitted" && !member.contactPhone
        ).length;
        const missingEmails = family.members.filter(
          (member) => member.rsvpStatus === "submitted" && !member.contactEmail
        ).length;

        summary.totalFamilies += 1;
        summary.totalInvited += invited;
        summary.receptionAttending += reception;
        summary.unableToAttend += unableToAttend;
        summary.submittedGuests += submittedGuests;
        summary.pendingGuests += invited - submittedGuests;
        summary.missingPhones += missingPhones;
        summary.missingEmails += missingEmails;

        if (family.rsvpStatus === "submitted") {
          summary.submittedFamilies += 1;
        } else {
          summary.pendingFamilies += 1;
        }

        return summary;
      },
      {
        totalFamilies: 0,
        submittedFamilies: 0,
        pendingFamilies: 0,
        totalInvited: 0,
        receptionAttending: 0,
        unableToAttend: 0,
        submittedGuests: 0,
        pendingGuests: 0,
        missingPhones: 0,
        missingEmails: 0,
      }
    );

    const rsvpCompletion =
      totals.totalInvited === 0
        ? 0
        : Math.round((totals.submittedGuests / totals.totalInvited) * 100);

    return NextResponse.json({
      totals: {
        ...totals,
        rsvpCompletion,
      },
      families,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load RSVP dashboard" },
      { status: 500 }
    );
  }
}
