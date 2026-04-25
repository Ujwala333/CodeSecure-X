"use client";

import type { ScanResponse } from "@/services/api";
import { HealthScoreGauge } from "@/components/shared/HealthScoreGauge";

interface Props {
  scoreData: ScanResponse;
}

export function HealthScoreCard({ scoreData }: Props) {
  const { security_health_score, score_label, severity_counts, critical_paths } = scoreData;

  const score = security_health_score || 0;
  const label = score_label || "Unknown";
  
  const high = severity_counts?.high || 0;
  const medium = severity_counts?.medium || 0;
  const low = severity_counts?.low || 0;
  const totalVulns = high + medium + low;

  return (
    <div className="glass rounded-2xl p-6 flex flex-col items-center justify-between h-full bg-[hsl(222,47%,10%)] border border-[hsl(222,47%,18%)]">
      
      <h3 className="text-xs font-bold tracking-widest text-[hsl(215,16%,55%)] uppercase mb-6 text-center">
        Security Health Score
      </h3>

      <HealthScoreGauge score={score} label={label} />

      {/* Summary Stats Footer */}
      <div className="flex w-full justify-between items-center border-t border-[hsl(222,47%,14%)] pt-4 gap-4 px-2">
        <div className="flex flex-col items-center text-center">
          <span className="text-lg font-bold text-white">{totalVulns}</span>
          <span className="text-[10px] text-[hsl(215,16%,55%)] uppercase font-semibold tracking-wider">
            Vulnerabilities
          </span>
        </div>
        <div className="w-px h-8 bg-[hsl(222,47%,14%)]"></div>
        <div className="flex flex-col items-center text-center">
          <span className="text-lg font-bold text-white">
            {critical_paths !== undefined ? critical_paths : high}
          </span>
          <span className="text-[10px] text-[hsl(215,16%,55%)] uppercase font-semibold tracking-wider">
            Critical Paths
          </span>
        </div>
      </div>

    </div>
  );
}
