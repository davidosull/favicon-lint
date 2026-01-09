import {
  Section,
  Text,
  Button,
  Link,
} from '@react-email/components';
import { BaseEmail } from './BaseEmail';

interface VerificationEmailProps {
  domain: string;
  verifyUrl: string;
  frequency: 'monthly';
}

export function VerificationEmail({
  domain,
  verifyUrl,
  frequency,
}: VerificationEmailProps) {
  return (
    <BaseEmail preview={`Verify your favicon monitoring for ${domain}`}>
      <Section>
        <Text style={heading}>Confirm your monitoring</Text>

        <Text style={paragraph}>
          Click the button below to start receiving {frequency} favicon monitoring
          alerts for <strong>{domain}</strong>.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={verifyUrl}>
            Verify &amp; Start Monitoring
          </Button>
        </Section>

        <Text style={smallText}>
          Or copy this link into your browser:
        </Text>
        <Text style={linkText}>
          <Link href={verifyUrl} style={link}>
            {verifyUrl}
          </Link>
        </Text>

        <Text style={smallText}>
          This link expires in 24 hours. If you didn&apos;t request this,
          you can safely ignore this email.
        </Text>
      </Section>
    </BaseEmail>
  );
}

const heading = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#0a0a0a',
  margin: '0 0 16px 0',
};

const paragraph = {
  fontSize: '14px',
  color: '#525f7f',
  lineHeight: '24px',
  margin: '0 0 24px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const smallText = {
  fontSize: '12px',
  color: '#8898aa',
  lineHeight: '20px',
  margin: '16px 0 4px 0',
};

const linkText = {
  fontSize: '12px',
  margin: '0 0 16px 0',
  wordBreak: 'break-all' as const,
};

const link = {
  color: '#3b82f6',
  textDecoration: 'none',
};

export default VerificationEmail;
