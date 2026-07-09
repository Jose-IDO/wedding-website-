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

async function inspectFirestoreStructure() {
  const collections = await db.listCollections();

  console.log("\nFIRESTORE DATA STRUCTURE");
  console.log("========================\n");

  for (const collectionRef of collections) {
    console.log(`Collection: ${collectionRef.id}`);

    const snapshot = await collectionRef.limit(5).get();

    if (snapshot.empty) {
      console.log("  No documents found.\n");
      continue;
    }

    for (const doc of snapshot.docs) {
      const data = doc.data();

      console.log(`  Document ID: ${doc.id}`);
      console.log("  Fields:");

      Object.entries(data).forEach(([key, value]) => {
        const type = Array.isArray(value)
          ? "array"
          : value === null
          ? "null"
          : typeof value;

        console.log(`    - ${key}: ${type}`);
      });

      const subcollections = await doc.ref.listCollections();

      if (subcollections.length > 0) {
        console.log("  Subcollections:");

        for (const subcollection of subcollections) {
          console.log(`    - ${subcollection.id}`);

          const subSnapshot = await subcollection.limit(3).get();

          for (const subDoc of subSnapshot.docs) {
            const subData = subDoc.data();

            console.log(`      Document ID: ${subDoc.id}`);
            console.log("      Fields:");

            Object.entries(subData).forEach(([key, value]) => {
              const type = Array.isArray(value)
                ? "array"
                : value === null
                ? "null"
                : typeof value;

              console.log(`        - ${key}: ${type}`);
            });
          }
        }
      }

      console.log("");
    }

    console.log("");
  }

  console.log("Inspection complete.");
}

inspectFirestoreStructure().catch((error) => {
  console.error(error);
  process.exit(1);
});