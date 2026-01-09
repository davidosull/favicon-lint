import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { scanFavicons } from '@/lib/scanner';
import { sendAlertEmail } from '@/lib/email';

const SCORE_CHANGE_THRESHOLD = 10;
const MIN_HOURS_BETWEEN_NOTIFICATIONS = 24;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getServiceClient();
    const now = new Date();

    // Only check active AND verified monitors
    const { data: monitors, error: fetchError } = await supabase
      .from('monitors')
      .select('*')
      .eq('is_active', true)
      .eq('is_verified', true);

    if (fetchError) {
      throw fetchError;
    }

    if (!monitors || monitors.length === 0) {
      return NextResponse.json({ message: 'No monitors to check', checked: 0 });
    }

    const monitorsToCheck = monitors.filter(monitor => {
      if (!monitor.last_checked) return true;

      const lastChecked = new Date(monitor.last_checked);
      const hoursSinceLastCheck = (now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60);

      // Monthly frequency: check every 30 days (720 hours)
      return hoursSinceLastCheck >= 720;
    });

    const results = {
      checked: 0,
      alerts_sent: 0,
      errors: 0
    };

    for (const monitor of monitorsToCheck) {
      try {
        const result = await scanFavicons(monitor.domain);
        const newScore = result.overallScore;
        const previousScore = monitor.last_score;

        await supabase
          .from('monitors')
          .update({
            last_checked: now.toISOString(),
            last_score: newScore
          })
          .eq('id', monitor.id);

        results.checked++;

        // Check if we should send an alert
        if (previousScore !== null) {
          const scoreDiff = Math.abs(newScore - previousScore);
          const shouldNotify = scoreDiff >= SCORE_CHANGE_THRESHOLD;

          if (shouldNotify) {
            const hoursSinceLastNotification = monitor.last_notified
              ? (now.getTime() - new Date(monitor.last_notified).getTime()) / (1000 * 60 * 60)
              : Infinity;

            if (hoursSinceLastNotification >= MIN_HOURS_BETWEEN_NOTIFICATIONS) {
              // Send alert email
              const emailResult = await sendAlertEmail(
                monitor.email,
                monitor.domain,
                previousScore,
                newScore,
                monitor.unsubscribe_token
              );

              if (emailResult.success) {
                await supabase
                  .from('monitors')
                  .update({ last_notified: now.toISOString() })
                  .eq('id', monitor.id);

                results.alerts_sent++;
              } else {
                console.error(`Failed to send alert for ${monitor.domain}:`, emailResult.error);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Failed to check monitor for ${monitor.domain}:`, error);
        results.errors++;
      }
    }

    return NextResponse.json({
      message: 'Monitor check completed',
      ...results
    });

  } catch (error) {
    console.error('Monitor check failed:', error);
    return NextResponse.json({
      error: 'Monitor check failed',
      message: String(error)
    }, { status: 500 });
  }
}
