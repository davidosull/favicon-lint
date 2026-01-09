import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { z } from 'zod';

const requestSchema = z.object({
  token: z.string().uuid('Invalid verification token')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = requestSchema.parse(body);

    const supabase = getServiceClient();

    // Find monitor with this verification token
    const { data: monitor } = await supabase
      .from('monitors')
      .select('id, domain, verification_expires, is_verified')
      .eq('verification_token', token)
      .single();

    if (!monitor) {
      return NextResponse.json({
        error: 'Invalid token',
        message: 'This verification link is invalid or has already been used.'
      }, { status: 404 });
    }

    if (monitor.is_verified) {
      return NextResponse.json({
        success: true,
        domain: monitor.domain,
        message: 'This email has already been verified.',
        alreadyVerified: true
      });
    }

    // Check if token has expired
    if (monitor.verification_expires) {
      const expires = new Date(monitor.verification_expires);
      if (expires < new Date()) {
        return NextResponse.json({
          error: 'Token expired',
          message: 'This verification link has expired. Please subscribe again to receive a new link.'
        }, { status: 410 });
      }
    }

    // Mark as verified and clear verification token
    await supabase
      .from('monitors')
      .update({
        is_verified: true,
        verification_token: null,
        verification_expires: null
      })
      .eq('id', monitor.id);

    return NextResponse.json({
      success: true,
      domain: monitor.domain,
      message: `You're now monitoring ${monitor.domain}. You'll receive alerts when issues are detected.`
    });

  } catch (error) {
    console.error('Verification failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request',
        details: error.issues
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Verification failed',
      message: 'Something went wrong. Please try again.'
    }, { status: 500 });
  }
}
