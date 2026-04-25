"use client";

import { useState } from "react";
import { ScanForm } from "@/components/ScanForm";
import { HealthScoreCard } from "@/components/scan/HealthScoreCard";
import { ScanLine } from "lucide-react";
import type { ScanResponse } from "@/services/api";
import { withAuth } from "@/lib/withAuth";

function ScanPage() {
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ScanLine className="w-5 h-5 text-[hsl(210,100%,56%)]" />
          <h1 className="text-2xl font-bold">Code Security Scanner</h1>
        </div>
        <p className="text-[hsl(215,16%,55%)] text-sm">
          Paste your code below and click <strong>Analyze Code</strong>. Results appear in seconds.
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1 w-full min-w-0">
          <ScanForm onScanComplete={setScanResult} />
        </div>
        
        {scanResult?.security_health_score !== undefined && (
          <div className="w-full md:w-[320px] shrink-0 animate-in fade-in slide-in-from-right-4 duration-500">
            <HealthScoreCard scoreData={scanResult} />
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(ScanPage);
