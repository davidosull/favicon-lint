import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await cleanupExpiredCache();

    return NextResponse.json({
      success: true,
      message: 'Cache cleaned up'
    });

  } catch (error) {
    console.error('Cache cleanup failed:', error);
    return NextResponse.json({
      error: 'Cleanup failed',
      message: String(error)
    }, { status: 500 });
  }
}
