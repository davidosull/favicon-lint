import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { z } from 'zod';

const requestSchema = z.object({
  token: z.string().uuid('Invalid unsubscribe token')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = requestSchema.parse(body);

    const supabase = getServiceClient();

    const { data: monitor } = await supabase
      .from('monitors')
      .select('id, domain')
      .eq('unsubscribe_token', token)
      .single();

    if (!monitor) {
      return NextResponse.json({
        error: 'Not found',
        message: 'This unsubscribe link is invalid or has already been used.'
      }, { status: 404 });
    }

    await supabase
      .from('monitors')
      .update({ is_active: false })
      .eq('id', monitor.id);

    return NextResponse.json({
      success: true,
      domain: monitor.domain,
      message: `You've been unsubscribed from monitoring alerts for ${monitor.domain}.`
    });

  } catch (error) {
    console.error('Unsubscribe failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request',
        details: error.issues
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Unsubscribe failed',
      message: 'Something went wrong. Please try again.'
    }, { status: 500 });
  }
}
