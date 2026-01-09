import { getServiceClient } from './supabase';
import { hashIP } from './utils';
import type { RateLimitStatus } from '@/types';

const HOURLY_LIMIT = 20;
const DAILY_LIMIT = 50;

export async function checkRateLimit(ip: string): Promise<RateLimitStatus> {
  const ipHash = hashIP(ip);
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  try {
    const supabase = getServiceClient();

    const { data: existing } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('ip_hash', ipHash)
      .single();

    if (!existing) {
      await supabase.from('rate_limits').insert({
        ip_hash: ipHash,
        scan_count_hour: 1,
        scan_count_day: 1,
        window_start_hour: now.toISOString(),
        window_start_day: now.toISOString()
      });

      return {
        allowed: true,
        hourlyRemaining: HOURLY_LIMIT - 1,
        dailyRemaining: DAILY_LIMIT - 1
      };
    }

    let hourlyCount = existing.scan_count_hour;
    let dailyCount = existing.scan_count_day;
    let windowStartHour = new Date(existing.window_start_hour);
    let windowStartDay = new Date(existing.window_start_day);

    if (windowStartHour < hourAgo) {
      hourlyCount = 0;
      windowStartHour = now;
    }

    if (windowStartDay < dayAgo) {
      dailyCount = 0;
      windowStartDay = now;
    }

    if (hourlyCount >= HOURLY_LIMIT) {
      const retryAfter = Math.ceil((windowStartHour.getTime() + 60 * 60 * 1000 - now.getTime()) / 1000);
      return {
        allowed: false,
        hourlyRemaining: 0,
        dailyRemaining: Math.max(0, DAILY_LIMIT - dailyCount),
        retryAfter
      };
    }

    if (dailyCount >= DAILY_LIMIT) {
      const retryAfter = Math.ceil((windowStartDay.getTime() + 24 * 60 * 60 * 1000 - now.getTime()) / 1000);
      return {
        allowed: false,
        hourlyRemaining: Math.max(0, HOURLY_LIMIT - hourlyCount),
        dailyRemaining: 0,
        retryAfter
      };
    }

    await supabase
      .from('rate_limits')
      .update({
        scan_count_hour: hourlyCount + 1,
        scan_count_day: dailyCount + 1,
        window_start_hour: windowStartHour.toISOString(),
        window_start_day: windowStartDay.toISOString()
      })
      .eq('ip_hash', ipHash);

    return {
      allowed: true,
      hourlyRemaining: HOURLY_LIMIT - hourlyCount - 1,
      dailyRemaining: DAILY_LIMIT - dailyCount - 1
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return {
      allowed: true,
      hourlyRemaining: HOURLY_LIMIT,
      dailyRemaining: DAILY_LIMIT
    };
  }
}

export async function cleanupRateLimits(): Promise<void> {
  const supabase = getServiceClient();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  await supabase
    .from('rate_limits')
    .delete()
    .lt('window_start_day', dayAgo.toISOString());
}
