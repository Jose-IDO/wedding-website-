import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";

type DeclinedMember = {
  id: string;
  fullName: string;
  contactEmail?: string;
  contactPhone?: string;
};

export async function POST(request: Request) {
  try {
    const { familyId, surname, guestGroup, members } = await request.json();

    if (!familyId || !Array.isArray(members)) {
      return NextResponse.json(
        { error: "Family ID and declined members are required" },
        { status: 400 }
      );
    }

    const batch = adminDb.batch();

    for (const member of members as DeclinedMember[]) {
      const declineId = `${familyId}-${member.id}`;
      const declineRef = adminDb.collection("declinedRsvps").doc(declineId);

      batch.set(
        declineRef,
        {
          familyId,
          surname: surname ?? "",
          guestGroup: guestGroup ?? "",
          memberId: member.id,
          fullName: member.fullName,
          contactEmail: member.contactEmail ?? "",
          contactPhone: member.contactPhone ?? "",
          declined: true,
          submittedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to save declined RSVP" },
      { status: 500 }
    );
  }
}