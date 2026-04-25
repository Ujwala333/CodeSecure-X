"use client";

import { useEffect, useState } from "react";

interface Props {
  score: number;
  label: string;
}

export function HealthScoreGauge({ score, label }: Props) {
  let colorVar = "hsl(0, 72%, 51%)"; // Default red
  let bgColorVar = "hsl(0, 72%, 51% / 0.15)";
  
  if (score >= 90) {
    colorVar = "hsl(142, 71%, 45%)";
    bgColorVar = "hsl(142, 71%, 45% / 0.15)";
  } else if (score >= 75) {
    colorVar = "hsl(142, 71%, 45%)";
    bgColorVar = "hsl(142, 71%, 45% / 0.15)";
  } else if (score >= 61) {
    colorVar = "hsl(45, 93%, 47%)";
    bgColorVar = "hsl(45, 93%, 47% / 0.15)";
  } else if (score >= 41) {
    colorVar = "hsl(38, 92%, 50%)";
    bgColorVar = "hsl(38, 92%, 50% / 0.15)";
  }

  const [displayScore, setDisplayScore] = useState(0);
  const [dashOffset, setDashOffset] = useState(339.292);

  useEffect(() => {
    const C = 2 * Math.PI * 54;
    const targetOffset = C - (C * (score / 100));
    
    const timer = setTimeout(() => {
      setDashOffset(targetOffset);
    }, 50);

    let startTimestamp: number | null = null;
    const duration = 1000;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setDisplayScore(Math.floor(progress * score));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayScore(score);
      }
    };

    window.requestAnimationFrame(step);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center mb-6">
        <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
          <circle
            cx="70" cy="70" r="54"
            fill="transparent"
            stroke="hsl(222, 47%, 16%)"
            strokeWidth="8"
          />
          <circle
            cx="70" cy="70" r="54"
            fill="transparent"
            stroke={colorVar}
            strokeWidth="8"
            strokeLinecap="round"
            style={{
              strokeDasharray: 339.292,
              strokeDashoffset: dashOffset,
              transition: "stroke-dashoffset 1s ease-out",
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white leading-none">
            {displayScore}
          </span>
          <span className="text-xs text-[hsl(215,16%,55%)] font-medium mt-1">
            /100
          </span>
        </div>
      </div>

      <div 
        className="px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase border"
        style={{ color: colorVar, backgroundColor: bgColorVar, borderColor: `${colorVar}4D` }}
      >
        {label}
      </div>
    </div>
  );
}
