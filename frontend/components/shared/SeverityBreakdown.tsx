"use client";

interface Counts {
  high: number;
  medium: number;
  low: number;
}

interface Props {
  counts: Counts;
}

export function SeverityBreakdown({ counts }: Props) {
  const total = (counts.high || 0) + (counts.medium || 0) + (counts.low || 0);

  if (total === 0) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-[hsl(142,71%,45%)] h-full justify-center">
        No vulnerabilities detected in this scan.
      </div>
    );
  }

  const rows = [
    { label: "HIGH", count: counts.high, color: "hsl(0, 72%, 51%)" },
    { label: "MEDIUM", count: counts.medium, color: "hsl(38, 92%, 50%)" },
    { label: "LOW", count: counts.low, color: "hsl(210, 100%, 56%)" },
  ];

  return (
    <div className="flex flex-col gap-4 w-full h-full justify-center py-2">
      {rows.map(row => (
        <div key={row.label} className="flex items-center gap-3">
          <div className="w-16 text-xs font-bold tracking-wider" style={{ color: row.color }}>
            {row.label}
          </div>
          <div className="flex-1 h-1.5 bg-[hsl(222,47%,16%)] rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${(row.count / Math.max(1, total)) * 100}%`, backgroundColor: row.color }} 
            />
          </div>
          <div className="w-8 text-right text-sm font-semibold text-white">
            {row.count}
          </div>
        </div>
      ))}
    </div>
  );
}
