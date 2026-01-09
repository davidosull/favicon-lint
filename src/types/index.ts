export interface FaviconCheck {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  details?: string;
  recommendation?: string;
}

export interface FaviconResult {
  url: string;
  size?: number;
  dimensions?: { width: number; height: number };
  format?: string;
  accessible: boolean;
  httpStatus?: number;
}

export interface ScanResult {
  domain: string;
  scannedAt: string;
  overallScore: number;
  categories: {
    basic: CategoryResult;
    sizes: CategoryResult;
    platforms: CategoryResult;
    accessibility: CategoryResult;
  };
  favicons: FaviconResult[];
  fromCache: boolean;
  cacheExpiresAt?: string;
}

export interface CategoryResult {
  name: string;
  score: number;
  checks: FaviconCheck[];
}

export interface ScanCache {
  id: string;
  domain: string;
  scan_data: ScanResult;
  cached_at: string;
  expires_at: string;
}

export interface Monitor {
  id: string;
  domain: string;
  email: string;
  email_hash: string;
  frequency: 'daily' | 'weekly';
  last_checked: string | null;
  last_score: number | null;
  last_notified: string | null;
  created_at: string;
  is_active: boolean;
  is_verified: boolean;
  verification_token: string | null;
  verification_expires: string | null;
  unsubscribe_token: string;
}

export interface RateLimit {
  id: string;
  ip_hash: string;
  scan_count_hour: number;
  scan_count_day: number;
  window_start_hour: string;
  window_start_day: string;
}

export interface AnalyticsEntry {
  id: string;
  scan_id: string;
  domain: string;
  timestamp: string;
  overall_score: number;
  issues_found: number;
  platform_detected: string | null;
  user_ip_hash: string;
  cached: boolean;
}

export interface RateLimitStatus {
  allowed: boolean;
  hourlyRemaining: number;
  dailyRemaining: number;
  retryAfter?: number;
}
