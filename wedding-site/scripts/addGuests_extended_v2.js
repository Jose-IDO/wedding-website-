const path = require("path");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require(path.join(
  __dirname,
  "../serviceAccountKey.json"
));

function normalizeId(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

const families = [
  {
    surname: "Bakare",
    guestGroup: "bride-groom",
    members: ["Adekunbi Bakare"],
  },
  {
    surname: "Akinleye",
    guestGroup: "bride-groom",
    members: [
      "Damola Akinleye",
      "Ibukun Akinleye",
    ],
  },
  {
    surname: "Mthethwa",
    guestGroup: "bride-groom",
    members: ["Lisa Mthethwa"],
  },
  {
    surname: "Ajayi",
    guestGroup: "bride-groom",
    members: ["Fayobi Ajayi"],
  },
  {
    surname: "Ayomidotun",
    guestGroup: "bride-groom",
    members: ["Hadassah Ayomidotun"],
  },
  {
    surname: "Oyedipe",
    guestGroup: "bride-groom",
    members: [
      "Dr Oyedipe",
      "Mrs Oyedipe",
    ],
  },
  {
    surname: "Alawode",
    guestGroup: "bride-groom",
    members: ["Taye Alawode"],
  },
];

async function addGuests() {
  for (const family of families) {
    const familyNameKey = normalizeId(family.surname);
    const familyId = `${family.guestGroup}-${familyNameKey}`;
    const familyRef = db.collection("families").doc(familyId);

    const familySnap = await familyRef.get();
    const existing = familySnap.exists ? familySnap.data() : {};

    const existingSearchNames = existing.searchNames || [];
    const existingMembersPreview = existing.membersPreview || [];

    await familyRef.set(
      {
        surname: family.surname,
        familyNameKey,
        guestGroup: family.guestGroup,
        rsvpStatus: existing.rsvpStatus || "pending",
        churchSeatLimit: Math.max(
          existing.churchSeatLimit || 0,
          family.members.length
        ),
        churchSeatsUsed: existing.churchSeatsUsed || 0,
        searchNames: [
          ...new Set([
            ...existingSearchNames,
            ...family.members.map(normalizeId),
          ]),
        ],
        membersPreview: [
          ...new Set([
            ...existingMembersPreview,
            ...family.members,
          ]),
        ].slice(0, 3),
      },
      { merge: true }
    );

    for (const fullName of family.members) {
      const memberRef = familyRef
        .collection("members")
        .doc(normalizeId(fullName));

      await memberRef.set(
        {
          fullName,
          contactEmail: "",
          contactPhone: "",
          attendingWedding: false,
          attendingChurch: false,
          churchEligible: true,
          rsvpStatus: "pending",
          submittedAt: null,
        },
        { merge: true }
      );

      console.log(`✓ Added ${fullName}`);
    }
  }

  console.log("");
  console.log("All guests added successfully.");
   console.log("All guests added successfully.");
}


addGuests().catch((err) => {
  console.error(err);
  process.exit(1);
});