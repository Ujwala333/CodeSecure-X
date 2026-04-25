// Shared TypeScript types for the profile — consumed by client components

export interface ProfileData {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: string;
  plan: string;
  member_since: string;
  total_scans_run: number;
  last_scan_at: string | null;
}
