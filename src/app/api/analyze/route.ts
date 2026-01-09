import { NextRequest, NextResponse } from 'next/server';
import { scanFavicons } from '@/lib/scanner';
import { checkRateLimit } from '@/lib/rateLimit';
import { getCachedScan, setCachedScan } from '@/lib/cache';
import { getServiceClient } from '@/lib/supabase';
import { hashIP, normalizeDomain } from '@/lib/utils';
import { z } from 'zod';
import type { RateLimitStatus } from '@/types';

const requestSchema = z.object({
  url: z.string().min(1, 'URL is required'),
  bypassCache: z.boolean().optional().default(false)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, bypassCache } = requestSchema.parse(body);

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               '127.0.0.1';

    let rateLimitResult: RateLimitStatus = {
      allowed: true,
      hourlyRemaining: 20,
      dailyRemaining: 50
    };

    try {
      rateLimitResult = await checkRateLimit(ip);
    } catch (error) {
      console.error('Rate limit check failed, allowing request:', error);
    }

    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        message: `You've used all your scans. Try again in ${Math.ceil((rateLimitResult.retryAfter || 0) / 60)} minutes.`,
        retryAfter: rateLimitResult.retryAfter,
        limits: {
          hourly: { remaining: rateLimitResult.hourlyRemaining },
          daily: { remaining: rateLimitResult.dailyRemaining }
        }
      }, { status: 429 });
    }

    if (!bypassCache) {
      try {
        const cachedResult = await getCachedScan(url);
        if (cachedResult) {
          return NextResponse.json({
            result: cachedResult,
            rateLimits: {
              hourlyRemaining: rateLimitResult.hourlyRemaining,
              dailyRemaining: rateLimitResult.dailyRemaining
            }
          }, {
            headers: { 'X-Cache': 'HIT' }
          });
        }
      } catch (error) {
        console.error('Cache lookup failed:', error);
      }
    }

    const result = await scanFavicons(url);

    try {
      await setCachedScan(url, result);
    } catch (error) {
      console.error('Cache write failed:', error);
    }

    try {
      const supabase = getServiceClient();
      const failedChecks = [
        ...result.categories.basic.checks,
        ...result.categories.sizes.checks,
        ...result.categories.platforms.checks,
        ...result.categories.accessibility.checks
      ].filter(c => c.status === 'fail' || c.status === 'warning').length;

      await supabase.from('analytics').insert({
        domain: normalizeDomain(url),
        overall_score: result.overallScore,
        issues_found: failedChecks,
        user_ip_hash: hashIP(ip),
        cached: false
      });
    } catch (error) {
      console.error('Analytics insert failed:', error);
    }

    return NextResponse.json({
      result,
      rateLimits: {
        hourlyRemaining: rateLimitResult.hourlyRemaining,
        dailyRemaining: rateLimitResult.dailyRemaining
      }
    }, {
      headers: { 'X-Cache': 'MISS' }
    });

  } catch (error) {
    console.error('Scan failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request',
        details: error.issues
      }, { status: 400 });
    }

    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        return NextResponse.json({
          error: 'Site unreachable',
          message: 'We couldn\'t access your site. Please check if it\'s online.'
        }, { status: 422 });
      }

      if (error.message.includes('HTTP 4') || error.message.includes('HTTP 5')) {
        return NextResponse.json({
          error: 'Site error',
          message: `The site returned an error: ${error.message}`
        }, { status: 422 });
      }
    }

    return NextResponse.json({
      error: 'Scan failed',
      message: 'Something went wrong. Please try again in a moment.'
    }, { status: 500 });
  }
}
