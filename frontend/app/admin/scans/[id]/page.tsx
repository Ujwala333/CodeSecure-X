"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Download, Code2, Calendar } from "lucide-react";
import { getApiUrl } from "@/lib/api-url";
import { withAuth } from "@/lib/withAuth";
import { downloadReport } from "@/services/api";
import toast from "react-hot-toast";
import { HealthScoreGauge } from "@/components/shared/HealthScoreGauge";
import { SeverityBreakdown } from "@/components/shared/SeverityBreakdown";

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
  return new Date(dateString).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function AdminScanPage({ params }: { params: any }) {
  const router = useRouter();
  
  // Safely unwrap Next 15 params map
  const unwrappedParams = React.use(params as any) as { id: string };
  const id = unwrappedParams.id;

  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScan = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");
        
        const baseUrl = getApiUrl();
        const res = await fetch(`${baseUrl}/admin/scans/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.status === 403) {
          router.push("/dashboard");
          return;
        }
        if (res.status === 404) {
          setError("404");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch");
        
        const data = await res.json();
        setScan(data);
      } catch (err: any) {
        setError(err.message || "Failed to load scan details.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchScan();
  }, [id, router]);

  // Handle 404 State natively
  if (error === "404") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#05050f", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <ShieldCheck style={{ width: "48px", height: "48px", color: "rgba(255,255,255,0.2)", marginBottom: "16px" }} />
        <h1 style={{ fontSize: "18px", color: "#fff", fontWeight: 600, marginBottom: "8px" }}>Scan not found</h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", marginBottom: "24px" }}>
          This scan may have been deleted or the ID is invalid.
        </p>
        <button onClick={() => router.push("/admin/reports")} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "rgba(255,255,255,0.8)", background: "transparent", border: "none", cursor: "pointer" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Reports
        </button>
      </div>
    );
  }

  return (
    <div className="adminWrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        .adminWrapper {
          min-height: 100vh;
          background-color: #05050f;
          background-image:
            radial-gradient(ellipse 80% 50% at 20% -10%, rgba(99,57,255,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 10%, rgba(56,128,255,0.12) 0%, transparent 55%),
            radial-gradient(ellipse 50% 60% at 50% 100%, rgba(120,40,200,0.10) 0%, transparent 60%);
          background-attachment: fixed;
          padding: 2rem 2.5rem;
          padding-bottom: 3rem;
        }
        .adminContainer { max-width: 1400px; margin: 0 auto; }
        .backLink {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 14px; color: rgba(255,255,255,0.5);
          cursor: pointer; background: transparent; border: none; padding: 0;
          margin-bottom: 24px; transition: color 0.2s ease;
        }
        .backLink:hover { color: rgba(255,255,255,0.9); }
        .downloadPdfBtn {
          background: rgba(99,57,255,0.1); border: 1px solid rgba(99,57,255,0.25);
          border-radius: 6px; padding: 6px 14px; font-size: 13px; font-weight: 500;
          color: #a78bfa; cursor: pointer; transition: background 0.2s, border-color 0.2s;
          display: inline-flex; align-items: center; gap: 6px; text-decoration: none;
        }
        .downloadPdfBtn:hover { background: rgba(99,57,255,0.2); border-color: rgba(99,57,255,0.45); }
        .sectionCard {
          background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px; padding: 24px 28px; margin-bottom: 20px;
        }
        .cardLabel {
          font-size: 11px; letter-spacing: 0.08em; color: rgba(255,255,255,0.35);
          text-transform: uppercase; margin-bottom: 12px; font-weight: 600;
        }
        .metaGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .metaItem {
          display: flex; flex-direction: column; gap: 4px; padding: 16px;
          background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);
        }
        .metaLabel { font-size: 11px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.08em; }
        .metaValue { font-size: 15px; color: #fff; font-weight: 500; }
        .gridTwoCol {
          display: grid; grid-template-columns: 1fr 2fr; gap: 24px;
        }
        @media (max-width: 768px) {
          .metaGrid, .gridTwoCol { grid-template-columns: 1fr; }
        }
      `}} />

      <div className="adminContainer">
        <button onClick={() => router.push("/admin/reports")} className="backLink">
          <ArrowLeft className="w-4 h-4" /> Back to Reports
        </button>

        {loading ? (
          <div className="space-y-6">
            <div className="h-8 w-48 bg-white/5 rounded-md skeleton" />
            <div className="sectionCard" style={{ height: "140px" }}></div>
            <div className="sectionCard" style={{ height: "240px" }}></div>
            <div className="sectionCard" style={{ height: "300px" }}></div>
          </div>
        ) : error ? (
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", padding: "16px", textAlign: "center" }}>
            {error}
            <div style={{ marginTop: "8px" }}>
              <button onClick={() => window.location.reload()} style={{ color: "#3b82f6", textDecoration: "underline" }}>Retry</button>
            </div>
          </div>
        ) : scan && (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px" }}>
              <div>
                <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#fff", marginBottom: "4px" }}>
                  {scan.scan_name}
                </h1>
                <div style={{ fontSize: "11px", letterSpacing: "0.05em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
                  ADMIN / REPORTS / {scan.scan_name}
                </div>
              </div>
              <button 
                onClick={async () => {
                  try {
                    await downloadReport(scan.scan_id);
                  } catch {
                    toast.error("Failed to download PDF report");
                  }
                }} 
                className="downloadPdfBtn cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>

            <div className="sectionCard">
              <div className="cardLabel">SCANNED BY</div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {scan.user?.avatar_url ? (
                  <img src={scan.user.avatar_url} alt="Avatar" style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(99,57,255,0.2)", color: "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "18px", flexShrink: 0 }}>
                    {(scan.user?.full_name?.[0] || scan.user?.email?.[0] || 'U').toUpperCase()}
                    {(scan.user?.email?.split('@')[1]?.[0] || 'D').toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>
                    {scan.user?.full_name}
                  </div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)" }}>
                    {scan.user?.email}
                  </div>
                </div>
              </div>
            </div>

            <div className="sectionCard">
              <div className="cardLabel">SCAN DETAILS</div>
              <div className="metaGrid">
                <div className="metaItem">
                  <span className="metaLabel">Scan Name</span>
                  <span className="metaValue" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {scan.scan_name?.length > 40 ? scan.scan_name.substring(0, 40) + "..." : scan.scan_name}
                  </span>
                </div>
                <div className="metaItem">
                  <span className="metaLabel">Language</span>
                  <span className="metaValue" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Code2 className="w-4 h-4 text-[hsl(215,16%,55%)]" />
                    {scan.language}
                  </span>
                </div>
                <div className="metaItem">
                  <span className="metaLabel">Date &amp; Time</span>
                  <div className="metaValue">
                    <div>{formatDate(scan.scanned_at)}</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>
                      {formatDistanceToNow(scan.scanned_at)}
                    </div>
                  </div>
                </div>
                <div className="metaItem">
                  <span className="metaLabel">Scan ID</span>
                  <span className="metaValue" style={{ fontFamily: "monospace", fontSize: "13px", color: "rgba(255,255,255,0.45)" }}>
                    {scan.scan_id?.substring(0, 8)}...
                  </span>
                </div>
              </div>
            </div>

            <div className="sectionCard">
              <div className="cardLabel">SECURITY HEALTH SCORE</div>
              <div className="gridTwoCol">
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "16px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                  <HealthScoreGauge score={scan.security_health_score} label={scan.score_label} />
                </div>
                <div style={{ display: "flex", alignItems: "center", padding: "16px" }}>
                  <SeverityBreakdown counts={scan.severity_counts} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default withAuth(AdminScanPage, "admin");
