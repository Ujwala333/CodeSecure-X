"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScanLine } from "lucide-react";
import StatCards from "@/components/dashboard/StatCards";
import VulnerabilitiesChart from "@/components/dashboard/VulnerabilitiesChart";
import RecentScans from "@/components/dashboard/RecentScans";
import AdminRedirect from "@/components/auth/AdminRedirect";
import type { DashboardSummary } from "@/lib/dashboard-types";
import api from "@/services/api";
import { useAuth } from "@/lib/auth-context";

// ─── Skeleton helpers ──────────────────────────────────────────────────────────

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass rounded-2xl p-5 h-28 skeleton" />
      ))}
    </div>
  );
}

function SkeletonChart() {
  return <div className="glass rounded-2xl h-72 skeleton" />;
}

function SkeletonTable() {
  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-12 rounded-xl skeleton" />
      ))}
    </div>
  );
}

// ─── Error banner ──────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="glass rounded-2xl p-4 border border-[hsl(0_72%_51%/0.3)] text-sm text-[hsl(0_72%_51%)]">
      ⚠️ {message}
    </div>
  );
}

// ─── Greeting helpers ──────────────────────────────────────────────────────────

function getGreeting(): string {
  return "Good morning";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useAuth();

  // Hydration safety
  const [greeting, setGreeting] = useState("Hello");
  const [today, setToday] = useState("");

  useEffect(() => {
    setGreeting(getGreeting());
    setToday(formatDate(new Date()));
  }, []);

  useEffect(() => {
    if (authLoading) return;

    const fetchDashboardData = async () => {
      try {
        const res = await api.get<DashboardSummary>("/dashboard/summary");
        setSummary(res.data);
        setFetchError(null);
      } catch (err: any) {
        setFetchError(err.message || "Could not fetch dashboard analytics.");
      }
    };

    fetchDashboardData();

    // Poll every 10 seconds for real-time updates
    const intervalId = setInterval(fetchDashboardData, 10000);

    return () => clearInterval(intervalId);
  }, [authLoading]);

  return (
    <>
      <AdminRedirect />
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, {user?.username ?? "security lead"}.
          </h1>
          <p className="text-xs text-[hsl(215_16%_55%)] mt-1">
            {today}
          </p>
        </div>
        <Link
          href="/scan"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:brightness-110 active:scale-95 whitespace-nowrap self-start"
          style={{
            background:
              "linear-gradient(135deg, hsl(210 100% 56%), hsl(210 100% 44%))",
            boxShadow: "0 0 20px hsl(210 100% 56% / 0.25)",
          }}
        >
          <ScanLine className="w-4 h-4" />
          Start New Scan
        </Link>
      </div>

      {/* ── Error ── */}
      {fetchError && <ErrorBanner message={fetchError} />}

      {/* ── Stat Cards ── */}
      {summary ? (
        <StatCards data={summary} />
      ) : (
        !fetchError && <SkeletonCards />
      )}

      {/* ── Chart ── */}
      {summary ? (
        <VulnerabilitiesChart data={summary.vulnerabilities_over_time} />
      ) : (
        !fetchError && <SkeletonChart />
      )}

      {/* ── Recent Scans ── */}
      {summary ? (
        <RecentScans scans={summary.recent_scans} />
      ) : (
        !fetchError && <SkeletonTable />
      )}
      </div>
    </>
  );
}

