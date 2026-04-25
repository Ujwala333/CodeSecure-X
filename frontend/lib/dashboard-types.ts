// Shared TypeScript types for the dashboard — consumed by both server and client components

export interface FindingsBreakdown {
  high: number;
  medium: number;
  low: number;
}

export interface RecentScanItem {
  id: string;
  name: string;
  environment: string;
  language: string;
  findings: FindingsBreakdown;
  scanned_at: string;
}

export interface VulnOverTimePoint {
  date: string;
  high: number;
  medium: number;
  low: number;
}

export interface DashboardSummary {
  total_scans: number;
  high_risk_issues: number;
  security_score: number;
  security_benchmark: number;
  score_label: string;
  total_scans_change_pct: number;
  high_risk_change_pct: number;
  vulnerabilities_over_time: VulnOverTimePoint[];
  recent_scans: RecentScanItem[];
}
