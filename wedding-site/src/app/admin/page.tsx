// src/app/admin/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const ADMIN_PIN = "081407";

type AdminMember = {
  id: string;
  fullName: string;
  attendingWedding: boolean;
  attendingChurch: boolean;
  churchEligible: boolean;
  unableToAttend?: boolean;
  contactEmail: string;
  contactPhone: string;
  rsvpStatus: string;
  submittedAt: string | null;
};

type AdminFamily = {
  id: string;
  surname: string;
  familyNameKey: string;
  guestGroup: "bride-groom" | "parents";
  contactEmail: string;
  contactPhone: string;
  rsvpStatus: string;
  submittedAt: string | null;
  churchSeatLimit: number;
  churchSeatsUsed: number;
  members: AdminMember[];
};

type DashboardData = {
  totals: {
    totalFamilies: number;
    submittedFamilies: number;
    pendingFamilies: number;
    totalInvited: number;
    receptionAttending: number;
    unableToAttend?: number;
    churchAttending?: number;
    brideGroomChurch?: number;
    parentsChurch?: number;
    rsvpCompletion: number;
    brideGroomChurchLimit?: number;
    parentsChurchLimit?: number;
    totalChurchLimit?: number;
  };
  families: AdminFamily[];
};

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "submitted" | "pending"
  >("all");
  const [selectedFamily, setSelectedFamily] = useState<AdminFamily | null>(
    null
  );

  useEffect(() => {
    if (!unlocked) return;

    async function loadDashboard() {
      setLoading(true);

      try {
        const [response] = await Promise.all([
          fetch("/api/admin/rsvps"),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error ?? "Failed to load dashboard");
        }

        setData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [unlocked]);

  const filteredFamilies = useMemo(() => {
    if (!data) return [];

    return data.families.filter((family) => {
      const matchesQuery =
        family.surname.toLowerCase().includes(query.toLowerCase()) ||
        family.contactPhone.toLowerCase().includes(query.toLowerCase()) ||
        family.contactEmail.toLowerCase().includes(query.toLowerCase()) ||
        family.members.some((member) =>
          member.fullName.toLowerCase().includes(query.toLowerCase())
        );

      const matchesStatus =
        statusFilter === "all" || family.rsvpStatus === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [data, query, statusFilter]);

  function handlePinSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pin === ADMIN_PIN) {
      setPinError("");
      setUnlocked(true);
      return;
    }

    setPinError("Incorrect PIN. Please try again.");
    setPin("");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3e7d6] px-4 py-8 text-[#243b5a] sm:px-8">
      <div
        className={`mx-auto max-w-7xl transition duration-500 ${
          !unlocked || loading || selectedFamily
            ? "scale-[0.99] blur-md"
            : "scale-100 blur-0"
        }`}
      >
        <p className="mb-2 text-xs uppercase tracking-[0.42em] text-[#9c8261]">
          Wedding Admin
        </p>

        <h1
          className={`${playfair.className} mb-8 text-4xl font-black sm:text-6xl`}
        >
          RSVP Dashboard
        </h1>

        {data && (
          <>
            <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                label="Families Invited"
                value={data.totals.totalFamilies}
              />
              <SummaryCard
                label="Families Responded"
                value={data.totals.submittedFamilies}
              />
              <SummaryCard
                label="Pending Families"
                value={data.totals.pendingFamilies}
              />
              <SummaryCard
                label="RSVP Completion"
                value={`${data.totals.rsvpCompletion}%`}
              />

              <SummaryCard
                label="Total Guests Invited"
                value={data.totals.totalInvited}
              />
              <SummaryCard
                label="Reception Guests"
                value={data.totals.receptionAttending}
              />
              <SummaryCard
                label="Unable To Attend"
                value={data.totals.unableToAttend ?? 0}
              />
            </section>

            <section className="mb-6 flex flex-col gap-3 rounded-[1.5rem] border border-[#c9a76b]/35 bg-[#fff8ed]/85 p-4 shadow-[0_18px_60px_rgba(36,59,90,0.08)] sm:flex-row">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search surname, guest, phone or email"
                className="w-full rounded-full border border-[#c9a76b]/40 bg-[#fff8ed] px-5 py-3 text-sm font-bold text-[#243b5a] outline-none"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as typeof statusFilter)
                }
                className="rounded-full border border-[#c9a76b]/40 bg-[#fff8ed] px-5 py-3 text-sm font-bold text-[#243b5a] outline-none"
              >
                <option value="all">All</option>
                <option value="submitted">Submitted</option>
                <option value="pending">Pending</option>
              </select>
            </section>

            <section className="space-y-4">
              {filteredFamilies.map((family) => {
                const receptionCount = family.members.filter(
                  (member) => member.attendingWedding
                ).length;

                return (
                  <button
                    type="button"
                    key={family.id}
                    onClick={() => setSelectedFamily(family)}
                    className="w-full rounded-[1.7rem] border border-[#c9a76b]/35 bg-[#fff8ed]/85 p-5 text-left shadow-[0_18px_60px_rgba(36,59,90,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(36,59,90,0.13)]"
                  >
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2
                          className={`${playfair.className} text-3xl font-black text-[#243b5a]`}
                        >
                          {family.surname}
                        </h2>

                        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[#9c8261]">
                          {family.guestGroup === "parents"
                            ? "Parents' Guest"
                            : "Bride & Groom Guest"}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${
                          family.rsvpStatus === "submitted"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {family.rsvpStatus}
                      </span>
                    </div>

                    <div className="mb-4 grid gap-3 text-sm text-[#4d5f78] sm:grid-cols-4">
                      <Info
                        label="Submitted"
                        value={formatSubmittedAt(family.submittedAt)}
                      />
                      <Info label="Reception" value={String(receptionCount)} />
                      <Info
                        label="Unable To Attend"
                        value={String(
                          family.members.filter((member) => member.unableToAttend)
                            .length
                        )}
                      />
                      <Info
                        label="Guest Contacts"
                        value={String(
                          family.members.filter(
                            (member) => member.contactEmail || member.contactPhone
                          ).length
                        )}
                      />
                    </div>

                    <div className="overflow-hidden rounded-[1.2rem] border border-[#c9a76b]/25">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-[#f8efe2] text-xs uppercase tracking-[0.18em] text-[#9c8261]">
                          <tr>
                            <th className="px-4 py-3">Guest</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Phone</th>
                            <th className="px-4 py-3">Reception</th>
                            <th className="px-4 py-3">Unable</th>
                          </tr>
                        </thead>

                        <tbody>
                          {family.members.map((member) => (
                            <tr
                              key={member.id}
                              className="border-t border-[#c9a76b]/20"
                            >
                              <td className="px-4 py-3 font-bold text-[#243b5a]">
                                {member.fullName}
                              </td>
                              <td className="px-4 py-3">
                                {member.contactEmail || "—"}
                              </td>
                              <td className="px-4 py-3">
                                {member.contactPhone || "—"}
                              </td>
                              <td className="px-4 py-3">
                                {member.attendingWedding ? "Yes" : "No"}
                              </td>
                              <td className="px-4 py-3">
                                {member.unableToAttend ? "Yes" : "No"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </button>
                );
              })}
            </section>
          </>
        )}
      </div>

      {!unlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#243b5a]/20 px-4 backdrop-blur-xl">
          <form
            onSubmit={handlePinSubmit}
            className="w-full max-w-sm rounded-[2rem] border border-white/45 bg-white/25 px-6 py-8 text-center shadow-[0_30px_120px_rgba(36,59,90,0.35)] backdrop-blur-2xl"
          >
            <p className="mb-3 text-xs uppercase tracking-[0.42em] text-[#9c8261]">
              Admin Access
            </p>

            <h2
              className={`${playfair.className} mb-5 text-4xl font-black text-[#243b5a]`}
            >
              Enter PIN
            </h2>

            <input
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              placeholder="••••••"
              className={`${playfair.className} mb-4 w-full rounded-full border border-white/60 bg-white/45 px-5 py-4 text-center text-2xl font-black tracking-[0.35em] text-[#243b5a] outline-none placeholder:text-[#9c8261]/45`}
            />

            {pinError && (
              <p className="mb-4 text-sm font-bold text-[#b91c1c]">
                {pinError}
              </p>
            )}

            <button
              type="submit"
              className={`${playfair.className} rounded-full border border-[#c9a76b] bg-[#243b5a] px-8 py-3 text-xs font-black uppercase tracking-[0.28em] text-[#fff8ed] shadow-[0_20px_70px_rgba(36,59,90,0.2)]`}
            >
              Unlock
            </button>
          </form>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#243b5a]/20 px-4 backdrop-blur-xl">
          <div className="w-full max-w-md rounded-[2rem] border border-white/45 bg-white/25 px-6 py-8 text-center shadow-[0_30px_120px_rgba(36,59,90,0.35)] backdrop-blur-2xl">
            <p className="mb-3 text-xs uppercase tracking-[0.42em] text-[#9c8261]">
              Loading
            </p>

            <h2
              className={`${playfair.className} mb-7 text-3xl font-black text-[#243b5a]`}
            >
              Loading RSVP dashboard...
            </h2>

            <div className="h-3 overflow-hidden rounded-full bg-white/45">
              <div className="h-full animate-[adminLoad_3s_ease-in-out_forwards] rounded-full bg-gradient-to-r from-[#b88a3d] via-[#e2c27d] to-[#b88a3d]" />
            </div>
          </div>

          <style jsx global>{`
            @keyframes adminLoad {
              from {
                width: 0%;
              }
              to {
                width: 100%;
              }
            }
          `}</style>
        </div>
      )}

      {selectedFamily && (
        <FamilyDetailDrawer
          family={selectedFamily}
          onClose={() => setSelectedFamily(null)}
        />
      )}
    </main>
  );
}

function FamilyDetailDrawer({
  family,
  onClose,
}: {
  family: AdminFamily;
  onClose: () => void;
}) {
  const receptionCount = family.members.filter(
    (member) => member.attendingWedding
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#243b5a]/20 backdrop-blur-xl">
      <button
        type="button"
        aria-label="Close detail drawer"
        onClick={onClose}
        className="absolute inset-0"
      />

      <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l border-white/45 bg-white/35 px-5 py-6 shadow-[0_30px_120px_rgba(36,59,90,0.35)] backdrop-blur-2xl sm:px-8">
        <button
          type="button"
          onClick={onClose}
          className="mb-6 rounded-full border border-[#c9a76b]/60 bg-[#fff8ed]/80 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#9c8261]"
        >
          Close
        </button>

        <p className="mb-2 text-xs uppercase tracking-[0.42em] text-[#9c8261]">
          Family Details
        </p>

        <h2
          className={`${playfair.className} mb-4 text-4xl font-black text-[#243b5a] sm:text-5xl`}
        >
          {family.surname}
        </h2>

        <span
          className={`mb-6 inline-block rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${
            family.rsvpStatus === "submitted"
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {family.rsvpStatus}
        </span>

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <Info
            label="Guest Group"
            value={
              family.guestGroup === "parents"
                ? "Parents' Guest"
                : "Bride & Groom Guest"
            }
          />
          <Info
            label="Submitted"
            value={formatSubmittedAt(family.submittedAt)}
          />
          <Info label="Reception" value={String(receptionCount)} />
          <Info
            label="Unable To Attend"
            value={String(
              family.members.filter((member) => member.unableToAttend).length
            )}
          />
        </div>

        <div className="space-y-3">
          {family.members.map((member) => (
            <div
              key={member.id}
              className="rounded-[1.3rem] border border-[#c9a76b]/30 bg-[#fff8ed]/80 p-4 shadow-[0_14px_42px_rgba(36,59,90,0.08)]"
            >
              <h3
                className={`${playfair.className} mb-3 text-2xl font-black text-[#243b5a]`}
              >
                {member.fullName}
              </h3>

              <div className="grid gap-2 sm:grid-cols-2">
                <Info label="Email" value={member.contactEmail || "—"} />
                <Info label="Phone" value={member.contactPhone || "—"} />
                <Info
                  label="Reception"
                  value={member.attendingWedding ? "Yes" : "No"}
                />
                <Info
                  label="Unable To Attend"
                  value={member.unableToAttend ? "Yes" : "No"}
                />
                <Info
                  label="Submitted"
                  value={formatSubmittedAt(member.submittedAt)}
                />
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function formatSubmittedAt(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#c9a76b]/35 bg-[#fff8ed]/85 p-5 shadow-[0_18px_60px_rgba(36,59,90,0.08)]">
      <p className="text-xs uppercase tracking-[0.22em] text-[#9c8261]">
        {label}
      </p>
      <p className={`${playfair.className} mt-2 text-4xl font-black`}>
        {value}
      </p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f8efe2]/70 px-4 py-3">
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[#9c8261]">
        {label}
      </p>
      <p className="mt-1 break-words font-bold text-[#243b5a]">{value}</p>
    </div>
  );
}