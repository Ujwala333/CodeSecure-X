"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Download, ExternalLink } from "lucide-react";
import { downloadReport } from "@/services/api";
import toast from "react-hot-toast";

function formatDistanceToNow(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return "just now";
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
}

export function ReportRow({ report }: { report: any }) {
  const router = useRouter();
  const displayName = report.user_name && report.user_name !== "Unknown"
    ? report.user_name
    : report.user_email && report.user_email !== "Unknown"
    ? report.user_email
    : null;

  const displayEmail = report.user_email && report.user_email !== "Unknown"
    ? report.user_email
    : null;

  const initials = displayEmail
    ? (displayName?.[0] ?? displayEmail[0]).toUpperCase() +
      (displayEmail.split("@")[1]?.[0] ?? "").toUpperCase()
    : "?";
                   
  const handleViewScan = () => {
    // Navigate to scan details (currently a placeholder as requested)
    router.push(`/admin/scans/${report.scan_id}`);
  };

  return (
    <div className="reportRow">
      {/* USER column */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(99,57,255,0.2)", color: "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px", flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ overflow: "hidden" }}>
          {displayName ? (
            <>
              <div style={{ color: "#fff", fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {displayName}
              </div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {displayEmail}
              </div>
            </>
          ) : displayEmail ? (
            <>
              <div style={{ color: "#fff", fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {displayEmail}
              </div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {displayEmail}
              </div>
            </>
          ) : (
            <>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Unknown User
              </div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                No email on record
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* SCAN NAME column */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>
        <FileText className="w-4 h-4 shrink-0" />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "250px" }} title={report.scan_name}>
          {report.scan_name && report.scan_name.length > 40 ? report.scan_name.substring(0, 40) + "..." : report.scan_name}
        </span>
      </div>
      
      {/* GENERATED column */}
      <div>
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px" }}>{formatDate(report.generated_at)}</div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>{formatDistanceToNow(report.generated_at)}</div>
      </div>
      
      {/* ACTIONS column */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button onClick={handleViewScan} className="viewScanBtn">
          View Scan
        </button>
        <button 
          onClick={async () => {
            try {
              await downloadReport(report.pdf_url || report.scan_id);
            } catch {
              toast.error("Failed to download PDF report");
            }
          }} 
          className="downloadPdfBtn cursor-pointer"
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}
