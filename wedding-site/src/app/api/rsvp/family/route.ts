import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

type GuestGroup = "bride-groom" | "parents";

type FamilyData = {
  surname?: string;
  familyNameKey?: string;
  guestGroup?: GuestGroup;
  searchNames?: string[];
  membersPreview?: string[];
};

type Suggestion = {
  id: string;
  surname: string;
  guestGroup: GuestGroup;
  membersPreview: string[];
  score: number;
};

function normalizeSurname(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function levenshteinDistance(a: string, b: string) {
  const matrix = Array.from({ length: a.length + 1 }, (_, row) =>
    Array.from({ length: b.length + 1 }, (_, col) =>
      row === 0 ? col : col === 0 ? row : 0
    )
  );

  for (let row = 1; row <= a.length; row += 1) {
    for (let col = 1; col <= b.length; col += 1) {
      const cost = a[row - 1] === b[col - 1] ? 0 : 1;

      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function similarityScore(searchValue: string, candidateValue: string) {
  const search = normalizeSurname(searchValue);
  const candidate = normalizeSurname(candidateValue);

  if (!search || !candidate) return 0;
  if (candidate === search) return 100;
  if (candidate.includes(search) || search.includes(candidate)) return 85;

  const distance = levenshteinDistance(search, candidate);
  const maxLength = Math.max(search.length, candidate.length);

  return Math.round((1 - distance / maxLength) * 100);
}

async function getFamilyWithMembers(
  familyDoc: FirebaseFirestore.QueryDocumentSnapshot
) {
  const membersSnapshot = await familyDoc.ref.collection("members").get();

  const members = membersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return {
    family: {
      id: familyDoc.id,
      ...familyDoc.data(),
    },
    members,
  };
}

async function getSuggestions(searchValue: string, guestGroup: GuestGroup) {
  const familiesSnapshot = await adminDb
    .collection("families")
    .where("guestGroup", "==", guestGroup)
    .get();

  const suggestions: Suggestion[] = [];

  for (const familyDoc of familiesSnapshot.docs) {
    const familyData = familyDoc.data() as FamilyData;

    const surname = familyData.surname ?? familyDoc.id;
    const familyNameKey = familyData.familyNameKey ?? surname;

    const searchCandidates = [
      surname,
      familyNameKey,
      ...(familyData.searchNames ?? []),
      ...(familyData.membersPreview ?? []),
    ];

    const score = searchCandidates.reduce((bestScore, candidate) => {
      return Math.max(bestScore, similarityScore(searchValue, candidate));
    }, 0);

    if (score >= 55) {
      suggestions.push({
        id: familyDoc.id,
        surname,
        guestGroup,
        membersPreview: familyData.membersPreview ?? [],
        score,
      });
    }
  }

  return suggestions
    .sort((a, b) => b.score - a.score || a.surname.localeCompare(b.surname))
    .slice(0, 5)
    .map(({ score, ...suggestion }) => suggestion);
}

export async function POST(request: Request) {
  try {
    const { surname, guestGroup } = await request.json();

    if (!surname || !guestGroup) {
      return NextResponse.json(
        { error: "Surname and guest group are required" },
        { status: 400 }
      );
    }

    if (guestGroup !== "bride-groom" && guestGroup !== "parents") {
      return NextResponse.json(
        { error: "Invalid guest group" },
        { status: 400 }
      );
    }

    const familyNameKey = normalizeSurname(surname);

    const familiesSnapshot = await adminDb
      .collection("families")
      .where("familyNameKey", "==", familyNameKey)
      .where("guestGroup", "==", guestGroup)
      .limit(1)
      .get();

    if (!familiesSnapshot.empty) {
      const familyDoc = familiesSnapshot.docs[0];
      const payload = await getFamilyWithMembers(familyDoc);

      return NextResponse.json(payload);
    }

    const suggestions = await getSuggestions(surname, guestGroup);

    return NextResponse.json(
      {
        error:
          suggestions.length > 0
            ? "Family not found. Did you mean one of these?"
            : "Family not found. Please check the spelling.",
        suggestions,
      },
      { status: 404 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch family" },
      { status: 500 }
    );
  }
}