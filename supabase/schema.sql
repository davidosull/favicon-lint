-- FaviconLint Database Schema
-- Run this in your Supabase SQL editor to create the required tables

-- Scan cache table
CREATE TABLE IF NOT EXISTS scan_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT UNIQUE NOT NULL,
  scan_data JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scan_cache_domain ON scan_cache(domain);
CREATE INDEX IF NOT EXISTS idx_scan_cache_expires ON scan_cache(expires_at);

-- Monitors table
CREATE TABLE IF NOT EXISTS monitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  email_hash TEXT NOT NULL,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly')) DEFAULT 'weekly',
  last_checked TIMESTAMPTZ,
  last_score INTEGER,
  last_notified TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  unsubscribe_token UUID DEFAULT gen_random_uuid() UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_monitors_domain ON monitors(domain);
CREATE INDEX IF NOT EXISTS idx_monitors_email_hash ON monitors(email_hash);
CREATE INDEX IF NOT EXISTS idx_monitors_active ON monitors(is_active);
CREATE INDEX IF NOT EXISTS idx_monitors_unsubscribe_token ON monitors(unsubscribe_token);

-- Rate limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash TEXT UNIQUE NOT NULL,
  scan_count_hour INTEGER DEFAULT 0,
  scan_count_day INTEGER DEFAULT 0,
  window_start_hour TIMESTAMPTZ DEFAULT NOW(),
  window_start_day TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_hash ON rate_limits(ip_hash);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID,
  domain TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  overall_score INTEGER,
  issues_found INTEGER,
  platform_detected TEXT,
  user_ip_hash TEXT,
  cached BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_analytics_domain ON analytics(domain);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp);

-- Enable Row Level Security
ALTER TABLE scan_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Policies for service role access (used by API routes)
CREATE POLICY "Service role full access to scan_cache" ON scan_cache
  FOR ALL USING (true);

CREATE POLICY "Service role full access to monitors" ON monitors
  FOR ALL USING (true);

CREATE POLICY "Service role full access to rate_limits" ON rate_limits
  FOR ALL USING (true);

CREATE POLICY "Service role full access to analytics" ON analytics
  FOR ALL USING (true);
