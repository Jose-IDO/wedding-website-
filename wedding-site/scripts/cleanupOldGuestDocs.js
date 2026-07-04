const path = require("path");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require(path.join(
  __dirname,
  "../serviceAccountKey.json"
));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

const DRY_RUN = false;

async function deleteSubcollectionDocs(collectionRef) {
  const snapshot = await collectionRef.get();

  for (const doc of snapshot.docs) {
    console.log(`      deleting member: ${doc.id}`);

    if (!DRY_RUN) {
      await doc.ref.delete();
    }
  }
}

async function cleanupOldGuestDocs() {
  const familiesSnapshot = await db.collection("families").get();

  const docsToDelete = familiesSnapshot.docs.filter((doc) => {
    const isNewBrideGroomDoc = doc.id.startsWith("bride-groom-");
    const isNewParentsDoc = doc.id.startsWith("parents-");

    return !isNewBrideGroomDoc && !isNewParentsDoc;
  });

  console.log("");
  console.log("Cleanup mode:", DRY_RUN ? "DRY RUN - nothing will be deleted" : "LIVE DELETE");
  console.log(`Old family documents found: ${docsToDelete.length}`);
  console.log("");

  for (const familyDoc of docsToDelete) {
    const family = familyDoc.data();

    console.log(`Family doc to delete: ${familyDoc.id}`);
    console.log(`   surname: ${family.surname ?? ""}`);
    console.log(`   guestGroup: ${family.guestGroup ?? ""}`);

    await deleteSubcollectionDocs(familyDoc.ref.collection("members"));

    console.log(`   deleting family doc: ${familyDoc.id}`);
    console.log("");

    if (!DRY_RUN) {
      await familyDoc.ref.delete();
    }
  }

  console.log("Cleanup complete.");
}

cleanupOldGuestDocs().catch((error) => {
  console.error(error);
  process.exit(1);
});
