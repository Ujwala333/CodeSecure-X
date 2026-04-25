"use client";

import { useEffect, useState } from "react";
import { fetchUsers, suspendUser, unsuspendUser, fetchAnalytics } from "@/services/api";
import type { AdminAnalytics } from "@/services/api";
import { Settings, Users, TrendingUp, UserX, UserCheck, RefreshCw, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { withAuth } from "@/lib/withAuth";

type User = { id: string; username: string; email: string; role: string; is_active: boolean; created_at: string };

function AdminPage() {
  const [users, setUsers]         = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading]     = useState(true);
  const [suspending, setSuspending] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [u, a] = await Promise.all([fetchUsers(), fetchAnalytics()]);
      setUsers(u);
      setAnalytics(a);
    } catch {
      toast.error("Failed to load admin data. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (id: string) => {
    setSuspending(id);
    try {
      await suspendUser(id);
      toast.success("User suspended.");
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_active: false } : u));
    } catch {
      toast.error("Failed to suspend user.");
    } finally {
      setSuspending(null);
    }
  };

  const handleUnsuspend = async (id: string) => {
    setSuspending(id);
    try {
      await unsuspendUser(id);
      toast.success("User restored.");
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_active: true } : u));
    } catch {
      toast.error("Failed to restore user.");
    } finally {
      setSuspending(null);
    }
  };



  useEffect(() => { load(); }, []);

  const maxVulnCount = analytics && analytics.top_vulnerabilities.length > 0
    ? Math.max(...analytics.top_vulnerabilities.map((v) => v.count))
    : 1;

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
        .adminContainer {
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Refresh Button */
        .refreshBtn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 8px 18px;
          color: rgba(255,255,255,0.8);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .refreshBtn:hover {
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.2);
        }

        /* Stat Cards */
        .statGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        .statCard {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 24px 28px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
        }
        .statCard:hover {
          border-color: rgba(99, 57, 255, 0.35);
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(99, 57, 255, 0.12);
        }
        .statCard::after {
          content: '';
          position: absolute;
          top: -40%; left: -20%;
          width: 140%; height: 140%;
          background: radial-gradient(ellipse at 30% 30%, rgba(99, 57, 255, 0.07) 0%, transparent 65%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .statCard:hover::after { opacity: 1; }
        .statCard > * { position: relative; z-index: 1; }

        /* Sections */
        .sectionCard {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 24px 28px;
          margin-bottom: 20px;
        }

        /* Table */
        .tableHeader {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1fr 1fr;
          padding: 10px 16px;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          margin-bottom: 4px;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .tableRow {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1fr 1fr;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          align-items: center;
          transition: background 0.15s ease;
          border-radius: 8px;
        }
        .tableRow:hover {
          background: rgba(255,255,255,0.04);
        }
        .tableRow:last-child {
          border-bottom: none;
        }
        .idCell {
          font-family: monospace;
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 160px;
        }

        /* Status Badges */
        .statusActive {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(40, 180, 100, 0.12);
          border: 1px solid rgba(40, 180, 100, 0.25);
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 500;
          color: #4ade80;
        }
        .statusActive::before {
          content: '';
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 6px rgba(74,222,128,0.7);
          flex-shrink: 0;
        }
        .statusSuspended {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(220,60,60,0.12);
          border: 1px solid rgba(220,60,60,0.25);
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 500;
          color: #f87171;
        }
        .statusSuspended::before {
          content: '';
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #f87171;
          box-shadow: 0 0 6px rgba(248,113,113,0.7);
          flex-shrink: 0;
        }

        /* Action Buttons */
        .suspendBtn {
          background: transparent;
          border: 1px solid rgba(220,60,60,0.3);
          border-radius: 6px;
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 500;
          color: #f87171;
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .suspendBtn:hover {
          background: rgba(220,60,60,0.12);
          border-color: rgba(220,60,60,0.5);
        }
        
        .restoreBtn {
          background: transparent;
          border: 1px solid rgba(40,180,100,0.3);
          border-radius: 6px;
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 500;
          color: #4ade80;
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .restoreBtn:hover {
          background: rgba(40,180,100,0.12);
          border-color: rgba(40,180,100,0.5);
        }

        /* Vulnerabilities List */
        .vulnRow {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          border-radius: 8px;
          transition: background 0.15s ease;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .vulnRow:hover {
          background: rgba(255,255,255,0.04);
        }
        .vulnRow:last-child {
          border-bottom: none;
        }
        .rankNum {
          font-size: 13px;
          font-weight: 700;
          color: #3b82f6;
          min-width: 20px;
          text-align: right;
        }
        .countBadge {
          font-size: 13px;
          font-weight: 600;
          color: #3b82f6;
          background: rgba(56,128,255,0.1);
          border-radius: 6px;
          padding: 3px 10px;
          min-width: 48px;
          text-align: center;
        }
        .vulnBar {
          height: 2px;
          background: rgba(56,128,255,0.15);
          border-radius: 2px;
          margin: 0 16px 0 36px;
        }
        .vulnBarFill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #6366f1);
          border-radius: 2px;
          transition: width 0.6s ease;
        }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
          .statGrid {
            grid-template-columns: 1fr;
          }
          .tableHeader, .tableRow {
            grid-template-columns: 2fr 1fr 1fr 2fr;
          }
          .hideMobile {
            display: none;
          }
        }
      `}} />

      <div className="adminContainer">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "32px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "11px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "4px", textTransform: "uppercase" }}>
              SYSTEM ADMINISTRATION
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Settings className="w-5 h-5 text-[hsl(210,100%,56%)]" style={{ width: "22px", height: "22px" }} />
              <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#fff", lineHeight: 1 }}>Admin Panel</h1>
            </div>
          </div>
          <button onClick={load} className="refreshBtn">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        {analytics && (
          <div className="statGrid">
            {[
              { label: "Total Scans", value: analytics.total_scans, icon: TrendingUp, bg: "rgba(56,128,255,0.12)", color: "rgba(56,128,255,1)" },
              { label: "Total Users", value: analytics.total_users, icon: Users, bg: "rgba(40,180,100,0.12)", color: "rgba(40,180,100,1)" },
              { label: "Active Users", value: analytics.active_users, icon: ShieldAlert, bg: "rgba(220,140,40,0.12)", color: "rgba(220,140,40,1)" },
            ].map(({ label, value, icon: Icon, bg, color }) => (
              <div key={label} className="statCard">
                <div style={{ background: bg, borderRadius: "8px", padding: "8px", display: "inline-flex", marginBottom: "8px", alignItems: "center", justifyContent: "center" }}>
                  <Icon style={{ width: "20px", height: "20px", color }} />
                </div>
                <p style={{ fontSize: "36px", fontWeight: 700, color: "#fff", letterSpacing: "-0.5px", margin: "8px 0 4px" }}>{value}</p>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Users table */}
        <div className="sectionCard">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Users style={{ width: "20px", height: "20px", color: "#fff" }} />
              <h2 style={{ fontSize: "17px", fontWeight: 600, color: "#fff" }}>Users</h2>
            </div>
            <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: "20px", padding: "3px 12px", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
              {users.length} Total
            </div>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl skeleton" />)}
            </div>
          ) : users.length === 0 ? (
            <p className="p-8 text-center text-sm text-[hsl(215,16%,55%)]">No users yet.</p>
          ) : (
            <div className="w-full">
              <div className="tableHeader">
                <div className="hideMobile">ID</div>
                <div>User</div>
                <div>Status</div>
                <div>Joined</div>
                <div>Action</div>
              </div>
              <div>
                {users.map((u) => (
                  <div key={u.id} className="tableRow">
                    <div className="idCell hideMobile" title={u.id}>{u.id.substring(0, 8)}...</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(99,57,255,0.2)", color: "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px", flexShrink: 0 }}>
                        {u.username ? u.username[0].toUpperCase() : u.email[0].toUpperCase()}
                      </div>
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ color: "#fff", fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {u.username || "Unknown"}
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {u.email}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className={u.is_active ? "statusActive" : "statusSuspended"}>
                        {u.is_active ? "Active" : "Suspended"}
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </div>
                    <div>
                      {u.is_active ? (
                        <button
                          onClick={() => handleSuspend(u.id)}
                          disabled={suspending === u.id}
                          className="suspendBtn"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          {suspending === u.id ? "…" : "Suspend"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnsuspend(u.id)}
                          disabled={suspending === u.id}
                          className="restoreBtn"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          {suspending === u.id ? "…" : "Reactivate"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top vulnerabilities */}
        {analytics && analytics.top_vulnerabilities.length > 0 && (
          <div className="sectionCard">
            <h2 style={{ fontSize: "17px", fontWeight: 600, color: "#fff", marginBottom: "20px" }}>
              Most Common Vulnerabilities
            </h2>
            <div>
              {analytics.top_vulnerabilities.map((v, i) => {
                const rankNum = i + 1;
                const rankColor = rankNum === 1 ? "#f59e0b" : rankNum === 2 ? "#94a3b8" : rankNum === 3 ? "#cd7c54" : "#3b82f6";
                return (
                  <div key={v.type} style={{ marginBottom: "8px" }}>
                    <div className="vulnRow">
                      <span className="rankNum" style={{ color: rankColor }}>
                        {rankNum}
                      </span>
                      <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)", flex: 1 }}>{v.type}</div>
                      <span className="countBadge">{v.count}×</span>
                    </div>
                    <div className="vulnBar">
                      <div className="vulnBarFill" style={{ width: `${(v.count / maxVulnCount) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(AdminPage, "admin");
