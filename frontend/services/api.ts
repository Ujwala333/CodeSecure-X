import axios from "axios";
import { getApiUrl } from "@/lib/api-url";

const api = axios.create({
  baseURL: getApiUrl(),
  headers: { "Content-Type": "application/json" },
  timeout: 180000, // 180s - deployed LLM scans can be slow, especially after cold starts
});

// ─── JWT Request Interceptor ───────────────────────────────────────────────────
// Automatically attach the Bearer token from localStorage to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── 401 Response Interceptor ─────────────────────────────────────────────────
// Clear token and redirect to /login on auth failure
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type Language = "python" | "javascript" | "java" | "php";
export type Severity = "Low" | "Medium" | "High" | "Critical";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Vulnerability {
  type: string;
  severity: Severity;
  explanation: string;
  fix: string;
  fixed_code?: string | null;
}

export interface ScanResponse {
  scan_id: string;
  vulnerabilities: Vulnerability[];
  security_health_score?: number;
  score_label?: string;
  severity_counts?: { high: number; medium: number; low: number };
  critical_paths?: number;
}

export interface ScanHistoryItem {
  scan_id: string;
  language: string;
  vulnerability_count: number;
  created_at: string;
}

export interface ReportResponse {
  report_id: string;
  scan_id: string;
  pdf_url: string;
  message?: string;
}

export interface AdminAnalytics {
  total_scans: number;
  total_users: number;
  active_users: number;
  top_vulnerabilities: { type: string; count: number }[];
}

export interface FileMetadata {
  filename: string;
  path: string;
  size: number;
  download_url: string;
}

export interface RepoAnalyzeResponse {
  repo: string;
  total_files: number;
  files: FileMetadata[];
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const register = (username: string, email: string, password: string) =>
  api.post<AuthUser>("/auth/register", { username, email, password }).then((r) => r.data);

export const loginApi = (email: string, password: string) =>
  api.post<TokenResponse>("/auth/login", { email, password }).then((r) => r.data);

export const getMe = () =>
  api.get<AuthUser>("/auth/me").then((r) => r.data);

export const forgotPassword = (email: string) =>
  api.post("/auth/forgot-password", { email }).then((r) => r.data);

export const resetPassword = (token: string, newPassword: string) =>
  api.post("/auth/reset-password", { token, new_password: newPassword }).then((r) => r.data);

// ─── Scan API ─────────────────────────────────────────────────────────────────

export const scanCode = (code: string, language: Language) =>
  api.post<ScanResponse>("/scan/analyze", { code, language }).then((r) => r.data);

export const getScanHistory = (limit = 50) =>
  api.get<ScanHistoryItem[]>("/history", { params: { limit } }).then((r) => r.data);

// ─── Report API ───────────────────────────────────────────────────────────────

export const generateReport = (scan_id: string) =>
  api.post<ReportResponse>("/report/generate", { scan_id }).then((r) => r.data);

export const downloadReport = async (pathOrId: string, filename?: string) => {
  const downloadPath = pathOrId.startsWith("/") ? pathOrId : `/report/${pathOrId}`;
  const response = await api.get(downloadPath, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename || `report_${pathOrId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ─── Admin API ────────────────────────────────────────────────────────────────

export const fetchAnalytics = () =>
  api.get<AdminAnalytics>("/admin/analytics").then((r) => r.data);

export const fetchUsers = () =>
  api.get<{ id: string; username: string; email: string; role: string; is_active: boolean; created_at: string }[]>("/admin/users").then((r) => r.data);

export const suspendUser = (userId: string) =>
  api.post("/admin/suspend", { user_id: userId }).then((r) => r.data);

export const unsuspendUser = (userId: string) =>
  api.post("/admin/unsuspend", { user_id: userId }).then((r) => r.data);

// ─── GitHub API ───────────────────────────────────────────────────────────────

export const analyzeRepo = (repoUrl: string) =>
  api.post<RepoAnalyzeResponse>("/github/analyze-repo", { repo_url: repoUrl }).then((r) => r.data);

export default api;
