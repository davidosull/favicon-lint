import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { cleanupExpiredCache } from '@/lib/cache';
import { cleanupRateLimits } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  try {
    const supabase = getServiceClient();
    const { error } = await supabase
      .from('scan_cache')
      .select('id', { count: 'exact', head: true });
    if (error) throw error;
    results.keepalive = 'ok';
  } catch (error) {
    results.keepalive = `failed: ${String(error)}`;
    return NextResponse.json(results, { status: 500 });
  }

  try {
    await cleanupExpiredCache();
    results.cacheCleanup = 'ok';
  } catch (error) {
    results.cacheCleanup = `failed: ${String(error)}`;
  }

  try {
    await cleanupRateLimits();
    results.rateLimitCleanup = 'ok';
  } catch (error) {
    results.rateLimitCleanup = `failed: ${String(error)}`;
  }

  return NextResponse.json({ success: true, ...results });
}
