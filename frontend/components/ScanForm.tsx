"use client";

import { useState } from "react";
import { CodeEditor } from "@/components/CodeEditor";
import { VulnerabilityTable } from "@/components/VulnerabilityTable";
import { Button } from "@/components/ui/button";
import { scanCode, generateReport, downloadReport, analyzeRepo } from "@/services/api";
import type { Language, ScanResponse, FileMetadata } from "@/services/api";
import {
  Loader2, ScanLine, ShieldAlert, FileDown, CheckCircle, Github, FileCode2
} from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  onScanComplete?: (result: ScanResponse) => void;
}

export function ScanForm({ onScanComplete }: Props) {
  const [activeTab, setActiveTab] = useState<"manual" | "github">("manual");
  const [code, setCode]           = useState("");
  const [language, setLanguage]   = useState<Language>("python");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<ScanResponse | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportId, setReportId]   = useState<string | null>(null);

  // GitHub integration state
  const [repoUrl, setRepoUrl] = useState("");
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoFiles, setRepoFiles] = useState<FileMetadata[]>([]);

  const handleScan = async () => {
    if (!code.trim()) {
      toast.error("Please enter some code first.");
      return;
    }
    setLoading(true);
    setResult(null);
    setReportId(null);
    try {
      const data = await scanCode(code, language);
      setResult(data);
      onScanComplete?.(data);
      toast.success(`Scan complete — ${data.vulnerabilities.length} issue(s) found.`);
    } catch (err: unknown) {
      const error = err as {
        code?: string;
        response?: { status?: number; data?: { detail?: string } };
        request?: unknown;
        message?: string;
      };
      const msg =
        error.response?.data?.detail ??
        (error.code === "ECONNABORTED"
          ? "Scan timed out while waiting for the deployed API. Please try again with a smaller snippet."
          : error.response?.status === 401
          ? "Please log in again before scanning."
          : error.request
            ? "Scan failed because the API could not be reached. Check CORS or the frontend API URL."
            : error.message || "Scan failed. Please try again.");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!result) return;
    setReportLoading(true);
    try {
      const report = await generateReport(result.scan_id);
      setReportId(report.report_id);
      toast.success("PDF report generated!");
    } catch {
      toast.error("Failed to generate report.");
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    try {
      await downloadReport(result.scan_id);
    } catch {
      toast.error("Failed to download PDF.");
    }
  };

  const handleLoadRepo = async () => {
    if (!repoUrl.trim()) return toast.error("Please enter a GitHub repository URL");
    setRepoLoading(true);
    setRepoFiles([]);
    try {
      const data = await analyzeRepo(repoUrl);
      setRepoFiles(data.files);
      toast.success(`Found ${data.total_files} analyzable files!`);
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.detail ?? "Failed to analyze repository";
      toast.error(msg);
    } finally {
      setRepoLoading(false);
    }
  };

  const handleSelectFile = async (file: FileMetadata) => {
    const loadingToast = toast.loading(`Fetching ${file.filename}...`);
    try {
      const resp = await fetch(file.download_url);
      if (!resp.ok) throw new Error("Failed to fetch file content");
      const text = await resp.text();
      setCode(text);
      
      // Basic language inference
      const ext = file.filename.split('.').pop()?.toLowerCase();
      if (ext === 'py') setLanguage('python');
      else if (['js', 'ts', 'jsx', 'tsx'].includes(ext || '')) setLanguage('javascript');
      else if (ext === 'java') setLanguage('java');
      else if (ext === 'php') setLanguage('php');
      
      setActiveTab("manual");
      toast.success(`Loaded ${file.filename} into editor`, { id: loadingToast });
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error fetching file", { id: loadingToast });
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-black/20 rounded-xl w-max">
        <button
          onClick={() => setActiveTab("manual")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "manual" ? "bg-[hsl(210,100%,56%)] text-white shadow-lg" : "text-gray-400 hover:text-white"
          }`}
        >
          <FileCode2 className="w-4 h-4" /> Code Editor
        </button>
        <button
          onClick={() => setActiveTab("github")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "github" ? "bg-[hsl(210,100%,56%)] text-white shadow-lg" : "text-gray-400 hover:text-white"
          }`}
        >
          <Github className="w-4 h-4" /> GitHub Repository
        </button>
      </div>

      {activeTab === "manual" ? (
        <div className="animate-in fade-in slide-in-from-left-2 duration-300">
          <div className="glass rounded-2xl p-5">
            <CodeEditor
              value={code}
              language={language}
              onChange={setCode}
              onLanguageChange={setLanguage}
            />
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Button
              onClick={handleScan}
              disabled={loading}
              className="gap-2 bg-[hsl(210,100%,56%)] hover:bg-[hsl(210,100%,48%)] text-white font-semibold px-6 py-2.5 rounded-xl glow transition-all"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
              ) : (
                <><ScanLine className="w-4 h-4" /> Analyze Code</>
              )}
            </Button>
            {result && (
              <div className="flex items-center gap-2 text-sm text-[hsl(142,71%,45%)] animate-in fade-in">
                <CheckCircle className="w-4 h-4" />
                Scan complete
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-6 space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Github className="w-5 h-5 text-white" />
              Analyze Repository
            </h3>
            <p className="text-sm text-gray-400">
              Enter a public GitHub repository to extract source files for scanning.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[hsl(210,100%,56%)] transition-all"
              onKeyDown={(e) => e.key === "Enter" && handleLoadRepo()}
            />
            <Button
              onClick={handleLoadRepo}
              disabled={repoLoading}
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-2.5 rounded-xl transition-all"
            >
              {repoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load Repo"}
            </Button>
          </div>

          {repoFiles.length > 0 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
              <h4 className="text-sm font-medium text-gray-300">Select a file to scan</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {repoFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => handleSelectFile(file)}
                    className="flex flex-col text-left p-3 rounded-xl bg-black/30 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
                  >
                    <span className="text-sm font-medium text-white truncate w-full group-hover:text-[hsl(210,100%,56%)] transition-colors">
                      {file.filename}
                    </span>
                    <span className="text-xs text-gray-500 truncate w-full">{file.path}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="glass rounded-2xl p-5 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[hsl(0,72%,51%)]" />
              <h2 className="font-bold text-lg">Scan Results</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[hsl(142,71%,45%)/0.15] hover:bg-[hsl(142,71%,45%)/0.25] text-[hsl(142,71%,45%)] border border-[hsl(142,71%,45%)/0.3] rounded-lg text-sm font-medium transition-colors cursor-pointer"
                title="Automatically generates and downloads the PDF report"
              >
                <FileDown className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
          <VulnerabilityTable vulnerabilities={result.vulnerabilities} />
        </div>
      )}
    </div>
  );
}
