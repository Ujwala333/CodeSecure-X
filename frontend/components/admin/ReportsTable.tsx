"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Search, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { getApiUrl } from "@/lib/api-url";
import { ReportRow } from "./ReportRow";

export function ReportsTable() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async (currentPage: number, currentSearch: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      
      const baseUrl = getApiUrl();
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "20",
        ...(currentSearch ? { search: currentSearch } : {})
      });
      
      const res = await fetch(`${baseUrl}/admin/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.status === 403) {
        router.push("/dashboard");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      
      const data = await res.json();
      setReports(data.reports);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      setError(err.message || "Failed to load reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchReports(1, search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    // We want to fetch if refreshKey or page changes (search is handled above)
    fetchReports(page, search);
  }, [page, refreshKey]);

  const handlePrev = () => setPage(p => Math.max(1, p - 1));
  const handleNext = () => setPage(p => Math.min(totalPages, p + 1));

  return (
    <>
      {/* Header logic is embedded within page wrapper but we keep the title local to follow spec instructions safely. */}
      <div style={{ display: "flex", alignItems: "flex-end", justifySelf: "stretch", justifyContent: "space-between", marginBottom: "32px", width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "4px", textTransform: "uppercase" }}>
            ADMIN / REPORTS
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText className="w-5 h-5 text-[hsl(210,100%,56%)]" style={{ width: "22px", height: "22px" }} />
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#fff", lineHeight: 1 }}>User Reports</h1>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "4px 14px", fontSize: "13px", fontWeight: 500, color: "rgba(255,255,255,0.6)" }}>
            {total} reports total
          </div>
          <button 
            onClick={() => setRefreshKey(k => k + 1)} 
            className="navBtn" 
            style={{ fontSize: "13px", padding: "6px 14px", gap: "6px" }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: "20px" }}>
        <Search className="w-4 h-4" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }} />
        <input
          type="text"
          placeholder="Search by user email or scan name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="reportSearch"
        />
      </div>

      {error ? (
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", padding: "16px", textAlign: "center" }}>
          {error}
          <div style={{ marginTop: "8px" }}>
            <button onClick={() => fetchReports(page, search)} style={{ color: "#3b82f6", textDecoration: "underline" }}>Retry</button>
          </div>
        </div>
      ) : (
        <div className="sectionCard tableSection" style={{ padding: "0" }}>
          {/* Table Header Row */}
          <div className="reportTableHeader">
            <div>USER</div>
            <div>SCAN NAME</div>
            <div>GENERATED</div>
            <div>ACTIONS</div>
          </div>

          <div>
            {loading ? (
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {[1, 2, 3, 4, 5].map((i) => (
                   <div key={i} className="h-16 rounded-xl skeleton" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
                <FileText style={{ width: "48px", height: "48px", color: "rgba(255,255,255,0.2)", marginBottom: "16px" }} />
                <p style={{ fontSize: "16px", color: "#fff", fontWeight: 500, marginBottom: "8px" }}>No reports found</p>
                {search ? (
                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>
                    No reports match your search. <button onClick={() => setSearch("")} style={{ color: "#3b82f6", marginLeft: "4px" }}>Clear search</button>
                  </p>
                ) : (
                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>No reports have been generated yet.</p>
                )}
              </div>
            ) : (
              <div>
                {reports.map((r) => <ReportRow key={r.report_id} report={r} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {reports.length > 0 && !loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px" }}>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)" }}>
            Showing {Math.min((page - 1) * 20 + 1, total)}–{Math.min(page * 20, total)} of {total} reports
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={handlePrev} disabled={page === 1} className="navBtn">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={handleNext} disabled={page === totalPages || totalPages === 0} className="navBtn">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

