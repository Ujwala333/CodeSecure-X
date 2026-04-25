"use client";

import { useMemo, useState, useRef } from "react";
import type { VulnOverTimePoint } from "@/lib/dashboard-types";

interface Props {
  data: VulnOverTimePoint[];
}

const W = 700;
const H = 220;
const PAD = { top: 20, right: 16, bottom: 36, left: 36 };

function scalePoints(
  series: number[],
  minVal: number,
  maxVal: number,
  count: number
): [number, number][] {
  const range = maxVal - minVal || 1;
  return series.map((v, i) => [
    PAD.left + (i / (count - 1)) * (W - PAD.left - PAD.right),
    PAD.top + (1 - (v - minVal) / range) * (H - PAD.top - PAD.bottom),
  ]);
}

function toPolyline(points: [number, number][]): string {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

function toSmoothPath(points: [number, number][]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

function formatXLabel(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${MONTHS[parseInt(month, 10) - 1]} ${day}`;
}

const LINES = [
  { key: "high" as const,   label: "HIGH", color: "hsl(0 72% 51%)",    fill: "hsl(0 72% 51% / 0.08)"   },
  { key: "medium" as const, label: "MED",  color: "hsl(38 92% 50%)",   fill: "hsl(38 92% 50% / 0.08)"  },
  { key: "low" as const,    label: "LOW",  color: "hsl(210 100% 56%)", fill: "hsl(210 100% 56% / 0.08)" },
];

export default function VulnerabilitiesChart({ data }: Props) {
  const allVals = data.flatMap((d) => [d.high, d.medium, d.low]);
  const minVal = Math.min(0, ...allVals);
  const maxVal = Math.max(1, ...allVals);
  const count = data.length || 1;

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || count <= 1) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    const scaleX = W / rect.width;
    const svgX = x * scaleX;
    
    const chartWidth = W - PAD.left - PAD.right;
    const relativeX = svgX - PAD.left;
    
    let i = Math.round((relativeX / chartWidth) * (count - 1));
    i = Math.max(0, Math.min(count - 1, i));
    setHoverIdx(i);
  };

  const handleMouseLeave = () => {
    setHoverIdx(null);
  };

  const seriesPoints = useMemo(
    () =>
      LINES.map(({ key }) =>
        scalePoints(
          data.map((d) => d[key]),
          minVal,
          maxVal,
          count
        )
      ),
    [data, minVal, maxVal, count]
  );

  // Pick ~6 evenly-spaced x-axis tick indices
  const tickIndices = useMemo(() => {
    const step = Math.max(1, Math.floor(count / 6));
    const result = [];
    for (let i = 0; i < count; i += step) result.push(i);
    if (result[result.length - 1] !== count - 1) result.push(count - 1);
    return result;
  }, [count]);

  // Y-axis gridlines
  const yTicks = [minVal, Math.round((minVal + maxVal) / 2), maxVal];

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-base">Vulnerabilities Over Time</h2>
          <p className="text-xs text-[hsl(215_16%_55%)] mt-0.5">
            Security performance across all microservices
          </p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {LINES.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: color }}
              />
              <span className="text-xs text-[hsl(215_16%_55%)]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          style={{ minWidth: "280px" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Horizontal grid + Y labels */}
          {yTicks.map((val, index) => {
            const y =
              PAD.top +
              (1 - (val - minVal) / (maxVal - minVal || 1)) *
                (H - PAD.top - PAD.bottom);
            return (
              <g key={index}>
                <line
                  x1={PAD.left}
                  y1={y}
                  x2={W - PAD.right}
                  y2={y}
                  stroke="hsl(222 47% 14%)"
                  strokeWidth="1"
                />
                <text
                  x={PAD.left - 4}
                  y={y + 4}
                  textAnchor="end"
                  fill="hsl(215 16% 45%)"
                  fontSize="9"
                  fontFamily="Inter, system-ui"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area fills */}
          {LINES.map(({ fill }, li) => {
            const pts = seriesPoints[li];
            if (!pts.length) return null;
            const bottomY = PAD.top + (H - PAD.top - PAD.bottom);
            const area =
              toSmoothPath(pts) +
              ` L ${pts[pts.length - 1][0]} ${bottomY} L ${pts[0][0]} ${bottomY} Z`;
            return <path key={li} d={area} fill={fill} />;
          })}

          {/* Lines */}
          {LINES.map(({ color }, li) => {
            const pts = seriesPoints[li];
            if (!pts.length) return null;
            return (
              <path
                key={li}
                d={toSmoothPath(pts)}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* X-axis labels */}
          {tickIndices.map((i) => {
            const x =
              PAD.left + (i / (count - 1)) * (W - PAD.left - PAD.right);
            return (
              <text
                key={i}
                x={x}
                y={H - 2}
                textAnchor="middle"
                fill="hsl(215 16% 45%)"
                fontSize="9"
                fontFamily="Inter, system-ui"
              >
                {formatXLabel(data[i]?.date ?? "")}
              </text>
            );
          })}

          {/* Hover effects */}
          {hoverIdx !== null && count > 1 && (
            <g>
              {/* Crosshair */}
              <line
                x1={PAD.left + (hoverIdx / (count - 1)) * (W - PAD.left - PAD.right)}
                y1={PAD.top}
                x2={PAD.left + (hoverIdx / (count - 1)) * (W - PAD.left - PAD.right)}
                y2={H - PAD.bottom}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
                pointerEvents="none"
              />
              {/* Highlighted Dots */}
              {LINES.map(({ color }, li) => {
                const pts = seriesPoints[li];
                if (!pts[hoverIdx]) return null;
                const [cx, cy] = pts[hoverIdx];
                return (
                  <circle
                    key={li}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth={2}
                    pointerEvents="none"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* HTML Tooltip Card */}
        {hoverIdx !== null && count > 1 && (
          <div
            className="absolute top-2 z-10 pointer-events-none p-3 rounded-lg shadow-xl"
            style={{
              backgroundColor: "rgba(20, 20, 35, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(4px)",
              left: `${( (PAD.left + (hoverIdx / (count - 1)) * (W - PAD.left - PAD.right)) / W ) * 100}%`,
              transform: (hoverIdx / (count - 1)) > 0.7 
                ? "translateX(calc(-100% - 12px))" 
                : "translateX(12px)",
              minWidth: "120px",
            }}
          >
            <div className="text-xs font-semibold text-[rgba(255,255,255,0.5)] mb-2 uppercase tracking-wide">
              {formatXLabel(data[hoverIdx]?.date ?? "")}
            </div>
            <div className="flex flex-col gap-1.5">
              {LINES.map(({ key, label, color }) => (
                <div key={label} className="flex items-center justify-between gap-4 text-sm font-medium">
                  <span style={{ color }}>{label}</span>
                  <span className="text-white">{data[hoverIdx]?.[key]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
