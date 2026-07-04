const path = require("path");
const XLSX = require("xlsx");
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

async function exportGuestList() {
  const familiesSnapshot = await db.collection("families").get();

  const rows = [];

  for (const familyDoc of familiesSnapshot.docs) {
    const family = familyDoc.data();

    const membersSnapshot = await familyDoc.ref
      .collection("members")
      .orderBy("fullName")
      .get();

    membersSnapshot.forEach((memberDoc) => {
      const member = memberDoc.data();

      rows.push({
        "Guest Group":
          family.guestGroup === "parents"
            ? "Guest of Parents"
            : "Guest of Bride & Groom",
        "Family / Household": family.surname || "",
        "Full Name": member.fullName || "",
        "RSVP Status": member.rsvpStatus || family.rsvpStatus || "pending",
        "Reception": member.attendingWedding ? "Yes" : "No",
        "Church Ceremony": member.attendingChurch ? "Yes" : "No",
        "Email Address": member.contactEmail || "",
        "Cellphone Number": member.contactPhone || "",
        "Church Eligible": member.churchEligible === false ? "No" : "Yes",
        "Family Document ID": familyDoc.id,
        "Member Document ID": memberDoc.id,
      });
    });
  }

  rows.sort((a, b) => {
    const groupCompare = a["Guest Group"].localeCompare(b["Guest Group"]);
    if (groupCompare !== 0) return groupCompare;

    const familyCompare = a["Family / Household"].localeCompare(
      b["Family / Household"]
    );
    if (familyCompare !== 0) return familyCompare;

    return a["Full Name"].localeCompare(b["Full Name"]);
  });

  const workbook = XLSX.utils.book_new();

  const allGuestsSheet = XLSX.utils.json_to_sheet(rows);

  XLSX.utils.book_append_sheet(workbook, allGuestsSheet, "All Guests");

  const brideGroomRows = rows.filter(
    (row) => row["Guest Group"] === "Guest of Bride & Groom"
  );

  const parentsRows = rows.filter(
    (row) => row["Guest Group"] === "Guest of Parents"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(brideGroomRows),
    "Bride & Groom"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(parentsRows),
    "Parents"
  );

  const summaryRows = [
    {
      Metric: "Total Guests",
      Count: rows.length,
    },
    {
      Metric: "Bride & Groom Guests",
      Count: brideGroomRows.length,
    },
    {
      Metric: "Parents Guests",
      Count: parentsRows.length,
    },
    {
      Metric: "Reception Attending",
      Count: rows.filter((row) => row.Reception === "Yes").length,
    },
    {
      Metric: "Church Attending",
      Count: rows.filter((row) => row["Church Ceremony"] === "Yes").length,
    },
    {
      Metric: "Missing Cellphone Numbers",
      Count: rows.filter((row) => !row["Cellphone Number"]).length,
    },
    {
      Metric: "Missing Email Addresses",
      Count: rows.filter((row) => !row["Email Address"]).length,
    },
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(summaryRows),
    "Summary"
  );

  const outputPath = path.join(__dirname, "../Guest List Export.xlsx");

  XLSX.writeFile(workbook, outputPath);

  console.log("");
  console.log("Guest list exported successfully.");
  console.log(`File created at: ${outputPath}`);
  console.log("");
  console.log(`Total Guests: ${rows.length}`);
  console.log(`Bride & Groom Guests: ${brideGroomRows.length}`);
  console.log(`Parents Guests: ${parentsRows.length}`);
}

exportGuestList().catch((error) => {
  console.error(error);
  process.exit(1);
});