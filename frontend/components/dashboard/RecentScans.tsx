"use client";

import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import type { RecentScanItem } from "@/lib/dashboard-types";

interface Props {
  scans: RecentScanItem[];
}

// Manual relative-time formatter — no date-fns required
function timeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
  const diffMo = Math.floor(diffDay / 30);
  return `${diffMo} month${diffMo !== 1 ? "s" : ""} ago`;
}

// Inline language icon (SVG text fallback)
function LangIcon({ lang }: { lang: string }) {
  const map: Record<string, string> = {
    python: "🐍",
    javascript: "⚡",
    java: "☕",
    php: "🐘",
    node: "⚡",
    "node.js": "⚡",
    typescript: "🔷",
    ruby: "💎",
    go: "🐹",
    rust: "🦀",
    cpp: "⚙️",
    c: "⚙️",
  };
  const emoji = map[lang.toLowerCase()] ?? "📄";
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm"
      style={{ background: "hsl(222 47% 12%)" }}
      title={lang}
    >
      {emoji}
    </span>
  );
}

function FindingsBadges({
  findings,
}: {
  findings: RecentScanItem["findings"];
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {findings.high > 0 && (
        <span className="badge-high text-xs font-semibold px-2 py-0.5 rounded-full">
          H:{findings.high}
        </span>
      )}
      {findings.medium > 0 && (
        <span className="badge-medium text-xs font-semibold px-2 py-0.5 rounded-full">
          M:{findings.medium}
        </span>
      )}
      {findings.low > 0 && (
        <span className="badge-low text-xs font-semibold px-2 py-0.5 rounded-full">
          L:{findings.low}
        </span>
      )}
      {findings.high === 0 && findings.medium === 0 && findings.low === 0 && (
        <span className="badge-low text-xs font-semibold px-2 py-0.5 rounded-full">
          Clean
        </span>
      )}
    </div>
  );
}

export default function RecentScans({ scans }: Props) {
  const router = useRouter();

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base">Recent Security Scans</h2>
        <button
          onClick={() => router.push("/scan")}
          className="text-xs font-medium hover:underline"
          style={{ color: "hsl(210 100% 56%)" }}
        >
          View All Scans →
        </button>
      </div>

      {scans.length === 0 ? (
        <p className="text-sm text-[hsl(215_16%_55%)] py-4 text-center">
          No scans yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="text-left text-xs text-[hsl(215_16%_45%)] border-b border-[hsl(222_47%_14%)]">
                <th className="pb-2 font-medium">Scan Name</th>
                <th className="pb-2 font-medium">Language</th>
                <th className="pb-2 font-medium">Findings</th>
                <th className="pb-2 font-medium">Time</th>
                <th className="pb-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(222_47%_11%)]">
              {scans.map((scan) => (
                <tr
                  key={scan.id}
                  className="hover:bg-[hsl(222_47%_8%)] transition-colors"
                >
                  <td className="py-3 pr-4">
                    <p className="font-medium text-[hsl(213_31%_91%)] truncate max-w-[160px]">
                      {scan.name}
                    </p>
                    <p className="text-xs text-[hsl(215_16%_45%)] truncate">
                      {scan.environment}
                    </p>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <LangIcon lang={scan.language} />
                      <span className="text-[hsl(213_31%_75%)]">
                        {scan.language}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <FindingsBadges findings={scan.findings} />
                  </td>
                  <td className="py-3 pr-4 text-xs text-[hsl(215_16%_55%)] whitespace-nowrap">
                    {timeAgo(scan.scanned_at)}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => router.push(`/scans/${scan.id}`)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                      style={{ background: "hsl(222 47% 12%)" }}
                      title="View scan"
                      aria-label="View scan details"
                    >
                      <Eye
                        className="w-4 h-4"
                        style={{ color: "hsl(210 100% 56%)" }}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
