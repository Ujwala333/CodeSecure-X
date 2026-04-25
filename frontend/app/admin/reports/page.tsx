"use client";

import { withAuth } from "@/lib/withAuth";
import { ReportsTable } from "@/components/admin/ReportsTable";

function AdminReportsPage() {
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

        /* Search input */
        .reportSearch {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 10px 16px 10px 40px;
          color: #fff;
          font-size: 14px;
          width: 100%;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .reportSearch:focus {
          border-color: rgba(99,57,255,0.5);
          box-shadow: 0 0 0 3px rgba(99,57,255,0.1);
        }

        /* Sections */
        .sectionCard {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          margin-bottom: 20px;
          overflow: hidden;
        }

        /* Table Components */
        .reportTableHeader {
          display: grid;
          grid-template-columns: 2.5fr 2fr 1.5fr 2fr;
          padding: 14px 24px;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .reportRow {
          display: grid;
          grid-template-columns: 2.5fr 2fr 1.5fr 2fr;
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: background 0.15s ease;
          align-items: center;
        }
        .reportRow:hover {
          background: rgba(255,255,255,0.04);
        }
        .reportRow:last-child {
          border-bottom: none;
        }

        /* Buttons */
        .viewScanBtn {
          background: rgba(56,128,255,0.1);
          border: 1px solid rgba(56,128,255,0.25);
          border-radius: 6px; padding: 6px 14px;
          font-size: 12px; font-weight: 500; color: #60a5fa;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          outline: none;
        }
        .viewScanBtn:hover {
          background: rgba(56,128,255,0.2); border-color: rgba(56,128,255,0.45);
        }
        
        .downloadPdfBtn {
          background: rgba(99,57,255,0.1);
          border: 1px solid rgba(99,57,255,0.25);
          border-radius: 6px; padding: 6px 14px;
          font-size: 12px; font-weight: 500; color: #a78bfa;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
        }
        .downloadPdfBtn:hover {
          background: rgba(99,57,255,0.2); border-color: rgba(99,57,255,0.45);
        }

        .navBtn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          padding: 6px 10px;
          color: rgba(255,255,255,0.8);
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          outline: none;
        }
        .navBtn:hover:not(:disabled) {
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.2);
        }
        .navBtn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        /* Mobile specific hiding */
        @media (max-width: 768px) {
          .reportTableHeader, .reportRow {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .reportTableHeader { display: none; }
        }
      `}} />

      <div className="adminContainer">
        <ReportsTable />
      </div>
    </div>
  );
}

export default withAuth(AdminReportsPage, "admin");
