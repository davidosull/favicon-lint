import { getServiceClient } from './supabase';
import { normalizeDomain } from './utils';
import type { ScanResult } from '@/types';

const CACHE_DURATION_HOURS = 6;

export async function getCachedScan(url: string): Promise<ScanResult | null> {
  const domain = normalizeDomain(url);

  try {
    const supabase = getServiceClient();
    const now = new Date().toISOString();

    const { data } = await supabase
      .from('scan_cache')
      .select('*')
      .eq('domain', domain)
      .gt('expires_at', now)
      .single();

    if (data) {
      return {
        ...data.scan_data,
        fromCache: true,
        cacheExpiresAt: data.expires_at
      };
    }

    return null;
  } catch (error) {
    console.error('Cache lookup failed:', error);
    return null;
  }
}

export async function setCachedScan(url: string, scanResult: ScanResult): Promise<void> {
  const domain = normalizeDomain(url);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_DURATION_HOURS * 60 * 60 * 1000);

  try {
    const supabase = getServiceClient();

    await supabase
      .from('scan_cache')
      .upsert({
        domain,
        scan_data: scanResult,
        cached_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
      }, {
        onConflict: 'domain'
      });
  } catch (error) {
    console.error('Cache write failed:', error);
  }
}

export async function invalidateCache(url: string): Promise<void> {
  const domain = normalizeDomain(url);

  try {
    const supabase = getServiceClient();

    await supabase
      .from('scan_cache')
      .delete()
      .eq('domain', domain);
  } catch (error) {
    console.error('Cache invalidation failed:', error);
  }
}

export async function cleanupExpiredCache(): Promise<void> {
  const supabase = getServiceClient();
  const now = new Date().toISOString();

  await supabase
    .from('scan_cache')
    .delete()
    .lt('expires_at', now);
}
