import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { hashEmail, normalizeDomain } from '@/lib/utils';
import { sendVerificationEmail } from '@/lib/email';
import { z } from 'zod';
import crypto from 'crypto';

const requestSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
  email: z.string().email('Invalid email address'),
  frequency: z.enum(['daily', 'weekly']).default('weekly')
});

const MAX_MONITORS_PER_EMAIL = 3;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, email, frequency } = requestSchema.parse(body);

    const normalizedDomain = normalizeDomain(domain);
    const emailHash = hashEmail(email);

    const supabase = getServiceClient();

    // Check existing verified monitors for this email
    const { data: existingMonitors } = await supabase
      .from('monitors')
      .select('id, domain, is_verified')
      .eq('email_hash', emailHash)
      .eq('is_active', true);

    const verifiedMonitors = existingMonitors?.filter(m => m.is_verified) || [];

    if (verifiedMonitors.length >= MAX_MONITORS_PER_EMAIL) {
      const alreadyMonitoring = verifiedMonitors.find(m => m.domain === normalizedDomain);
      if (!alreadyMonitoring) {
        return NextResponse.json({
          error: 'Limit reached',
          message: `You can only monitor up to ${MAX_MONITORS_PER_EMAIL} sites. Unsubscribe from another site first.`
        }, { status: 400 });
      }
    }

    // Check if already monitoring this domain
    const existingForDomain = existingMonitors?.find(m => m.domain === normalizedDomain);

    if (existingForDomain?.is_verified) {
      // Already verified and active
      await supabase
        .from('monitors')
        .update({ frequency, is_active: true })
        .eq('id', existingForDomain.id);

      return NextResponse.json({
        success: true,
        message: 'Your monitoring preferences have been updated.',
        isUpdate: true
      });
    }

    // Generate verification token (expires in 24 hours)
    const verificationToken = crypto.randomUUID();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const unsubscribeToken = crypto.randomUUID();

    if (existingForDomain && !existingForDomain.is_verified) {
      // Update existing unverified record with new token
      await supabase
        .from('monitors')
        .update({
          email,
          frequency,
          verification_token: verificationToken,
          verification_expires: verificationExpires,
          is_active: true
        })
        .eq('id', existingForDomain.id);
    } else {
      // Create new monitor record (unverified)
      const { error: insertError } = await supabase
        .from('monitors')
        .insert({
          domain: normalizedDomain,
          email,
          email_hash: emailHash,
          frequency,
          is_active: true,
          is_verified: false,
          verification_token: verificationToken,
          verification_expires: verificationExpires,
          unsubscribe_token: unsubscribeToken
        });

      if (insertError) {
        console.error('Failed to create monitor:', insertError);
        throw new Error('Failed to create monitor');
      }
    }

    // Send verification email
    const emailResult = await sendVerificationEmail(
      email,
      normalizedDomain,
      verificationToken,
      frequency
    );

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Don't fail the request, the user can request again
    }

    return NextResponse.json({
      success: true,
      message: 'Check your email to verify and start monitoring.',
      requiresVerification: true
    });

  } catch (error) {
    console.error('Subscribe failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request',
        details: error.issues
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Subscription failed',
      message: 'Something went wrong. Please try again.'
    }, { status: 500 });
  }
}
