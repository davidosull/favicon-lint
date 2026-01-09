import { NextRequest, NextResponse } from 'next/server';
import { cleanupRateLimits } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await cleanupRateLimits();

    return NextResponse.json({
      success: true,
      message: 'Rate limits cleaned up'
    });

  } catch (error) {
    console.error('Rate limit cleanup failed:', error);
    return NextResponse.json({
      error: 'Cleanup failed',
      message: String(error)
    }, { status: 500 });
  }
}
