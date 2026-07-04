const path = require("path");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const brideGroomFamilies = require("./guestLists/bride-groom");
const parentsFamilies = require("./guestLists/parents");

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

const families = [...brideGroomFamilies, ...parentsFamilies];

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

async function seedGuests() {
  for (const family of families) {
    const familyNameKey = normalizeId(family.surname);
    const familyId = `${family.guestGroup}-${familyNameKey}`;
    const familyRef = db.collection("families").doc(familyId);

    const uniqueMembers = [
      ...new Set(family.members.map((name) => name.trim())),
    ];

    const searchNames = uniqueMembers.map((name) => normalizeId(name));
    const membersPreview = uniqueMembers.slice(0, 3);

    await familyRef.set(
      {
        surname: family.surname,
        familyNameKey,
        searchNames,
        membersPreview,
        contactEmail: "",
        contactPhone: "",
        rsvpStatus: "pending",
        churchSeatLimit: uniqueMembers.length,
        churchSeatsUsed: 0,
        guestGroup: family.guestGroup,
      },
      { merge: true }
    );

    const existingMembers = await familyRef.collection("members").get();

    for (const doc of existingMembers.docs) {
      await doc.ref.delete();
    }

    for (const memberName of uniqueMembers) {
      const memberId = normalizeId(memberName);
      const memberRef = familyRef.collection("members").doc(memberId);

      await memberRef.set({
        fullName: memberName,
        contactEmail: "",
        contactPhone: "",
        attendingWedding: false,
        attendingChurch: false,
        churchEligible: true,
        rsvpStatus: "pending",
        submittedAt: null,
      });
    }

    console.log(
      `Seeded ${familyId}: ${uniqueMembers.length} guest${
        uniqueMembers.length === 1 ? "" : "s"
      }`
    );
  }

  console.log("Guest seeding complete.");
}

seedGuests().catch((error) => {
  console.error(error);
  process.exit(1);
});