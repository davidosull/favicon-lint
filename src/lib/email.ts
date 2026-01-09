import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { render } from '@react-email/components';
import { VerificationEmail } from '@/emails/VerificationEmail';
import { AlertEmail } from '@/emails/AlertEmail';

const ses = new SESClient({
  region: process.env.AWS_SES_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const FROM_EMAIL = process.env.EMAIL_FROM || 'FaviconLint <alerts@faviconlint.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://faviconlint.com';

interface SendEmailResult {
  success: boolean;
  error?: string;
}

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<SendEmailResult> {
  try {
    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
        },
      },
    });

    await ses.send(command);
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendVerificationEmail(
  email: string,
  domain: string,
  verificationToken: string,
  frequency: 'daily' | 'weekly'
): Promise<SendEmailResult> {
  const verifyUrl = `${APP_URL}/verify?token=${verificationToken}`;

  const html = await render(
    VerificationEmail({
      domain,
      verifyUrl,
      frequency,
    })
  );

  return sendEmail(
    email,
    `Verify your favicon monitoring for ${domain}`,
    html
  );
}

export async function sendAlertEmail(
  email: string,
  domain: string,
  previousScore: number,
  currentScore: number,
  unsubscribeToken: string
): Promise<SendEmailResult> {
  const scanUrl = `${APP_URL}/?url=${encodeURIComponent(domain)}`;
  const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${unsubscribeToken}`;
  const improved = currentScore > previousScore;

  const html = await render(
    AlertEmail({
      domain,
      previousScore,
      currentScore,
      scanUrl,
      unsubscribeUrl,
    })
  );

  return sendEmail(
    email,
    improved
      ? `Favicon score improved for ${domain}`
      : `Favicon issues detected on ${domain}`,
    html
  );
}
