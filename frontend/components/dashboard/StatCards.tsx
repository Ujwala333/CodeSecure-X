"use client";

import { TrendingUp, TrendingDown, ScanLine, AlertTriangle } from "lucide-react";
import type { DashboardSummary } from "@/lib/dashboard-types";

interface Props {
  data: DashboardSummary;
}

function ChangeBadge({ pct }: { pct: number }) {
  const positive = pct >= 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: positive
          ? "hsl(142 71% 45% / 0.15)"
          : "hsl(0 72% 51% / 0.15)",
        color: positive ? "hsl(142 71% 45%)" : "hsl(0 72% 51%)",
        border: positive
          ? "1px solid hsl(142 71% 45% / 0.3)"
          : "1px solid hsl(0 72% 51% / 0.3)",
      }}
    >
      {positive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {Math.abs(pct)}%
    </span>
  );
}

export default function StatCards({ data }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
      {/* Card 1 — Total Scans */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "hsl(210 100% 56% / 0.12)",
                border: "1px solid hsl(210 100% 56% / 0.25)",
              }}
            >
              <ScanLine className="w-4 h-4" style={{ color: "hsl(210 100% 56%)" }} />
            </div>
            <span className="text-xs text-[hsl(215_16%_55%)] font-medium">
              Total Scans
            </span>
          </div>
          <ChangeBadge pct={data.total_scans_change_pct} />
        </div>
        <p className="text-3xl font-bold tracking-tight">
          {data.total_scans.toLocaleString()}
        </p>
        <p className="text-xs text-[hsl(215_16%_45%)]">
          vs. previous month
        </p>
      </div>

      {/* Card 2 — High Risk Issues */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "hsl(0 72% 51% / 0.12)",
                border: "1px solid hsl(0 72% 51% / 0.25)",
              }}
            >
              <AlertTriangle className="w-4 h-4" style={{ color: "hsl(0 72% 51%)" }} />
            </div>
            <span className="text-xs text-[hsl(215_16%_55%)] font-medium">
              High Risk Issues
            </span>
          </div>
          <ChangeBadge pct={data.high_risk_change_pct} />
        </div>
        <p className="text-3xl font-bold tracking-tight">
          {data.high_risk_issues.toLocaleString()}
        </p>
        <p className="text-xs text-[hsl(215_16%_45%)]">
          vs. previous month
        </p>
      </div>
    </div>
  );
}
