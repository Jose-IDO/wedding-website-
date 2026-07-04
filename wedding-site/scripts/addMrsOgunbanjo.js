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

async function addMrsOgunbanjo() {
  const surname = "Ogunbanjo";
  const fullName = "Mrs Ogunbanjo";
  const guestGroup = "parents";

  const familyNameKey = normalizeId(surname);
  const familyId = `${guestGroup}-${familyNameKey}`;
  const memberId = normalizeId(fullName);

  const familyRef = db.collection("families").doc(familyId);
  const memberRef = familyRef.collection("members").doc(memberId);

  await familyRef.set(
    {
      surname,
      familyNameKey,
      guestGroup,
      searchNames: [normalizeId(fullName)],
      membersPreview: [fullName],
      rsvpStatus: "pending",
      churchSeatLimit: 1,
      churchSeatsUsed: 0,
    },
    { merge: true }
  );

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

  console.log("Added Mrs Ogunbanjo to parents guest group.");
}

addMrsOgunbanjo().catch((error) => {
  console.error(error);
  process.exit(1);
});