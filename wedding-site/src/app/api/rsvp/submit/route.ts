import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";

type SubmittedMember = {
  id: string;
  attendingWedding?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  unableToAttend?: boolean;
};

export async function POST(request: Request) {
  try {
    const { familyId, members } = await request.json();

    if (!familyId || !Array.isArray(members)) {
      return NextResponse.json(
        { error: "Family ID and members are required" },
        { status: 400 }
      );
    }

    const familyRef = adminDb.collection("families").doc(familyId);
    const familyDoc = await familyRef.get();

    if (!familyDoc.exists) {
      return NextResponse.json(
        { error: "Family not found" },
        { status: 404 }
      );
    }

    const batch = adminDb.batch();
    const submittedAt = FieldValue.serverTimestamp();

    batch.update(familyRef, {
      rsvpStatus: "submitted",
      submittedAt,
    });

    for (const member of members as SubmittedMember[]) {
      const memberRef = familyRef.collection("members").doc(member.id);
      const unableToAttend = Boolean(member.unableToAttend);
      const attendingWedding = unableToAttend
        ? false
        : Boolean(member.attendingWedding);

      batch.update(memberRef, {
        attendingWedding,
        attendingChurch: false,
        unableToAttend,
        contactEmail: member.contactEmail ?? "",
        contactPhone: member.contactPhone ?? "",
        rsvpStatus: "submitted",
        submittedAt,
      });

      const declineRef = adminDb
        .collection("declinedRsvps")
        .doc(`${familyId}-${member.id}`);

      if (unableToAttend) {
        batch.set(
          declineRef,
          {
            familyId,
            memberId: member.id,
            fullName: "",
            contactEmail: member.contactEmail ?? "",
            contactPhone: member.contactPhone ?? "",
            declined: true,
            submittedAt,
          },
          { merge: true }
        );
      } else {
        batch.delete(declineRef);
      }
    }

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to submit RSVP" },
      { status: 500 }
    );
  }
}
