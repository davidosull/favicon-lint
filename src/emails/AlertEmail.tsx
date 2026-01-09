import {
  Section,
  Text,
  Button,
  Link,
} from '@react-email/components';
import { BaseEmail } from './BaseEmail';

interface AlertEmailProps {
  domain: string;
  previousScore: number;
  currentScore: number;
  scanUrl: string;
  unsubscribeUrl: string;
}

export function AlertEmail({
  domain,
  previousScore,
  currentScore,
  scanUrl,
  unsubscribeUrl,
}: AlertEmailProps) {
  const improved = currentScore > previousScore;
  const scoreDiff = Math.abs(currentScore - previousScore);

  return (
    <BaseEmail
      preview={
        improved
          ? `Good news: ${domain} favicon score improved to ${currentScore}`
          : `Alert: ${domain} favicon score dropped to ${currentScore}`
      }
    >
      <Section>
        <Text style={heading}>
          {improved ? 'Favicon Score Improved' : 'Favicon Issues Detected'}
        </Text>

        <Text style={paragraph}>
          {improved
            ? `Great news! The favicon score for ${domain} has improved.`
            : `We detected new favicon issues on ${domain}.`}
        </Text>

        <Section style={scoreContainer}>
          <table style={scoreTable}>
            <tbody>
              <tr>
                <td style={scoreCell}>
                  <Text style={scoreLabel}>Previous</Text>
                  <Text style={scoreValue}>{previousScore}</Text>
                </td>
                <td style={arrowCell}>
                  <Text style={arrow}>{improved ? '\u2192' : '\u2192'}</Text>
                </td>
                <td style={scoreCell}>
                  <Text style={scoreLabel}>Current</Text>
                  <Text style={{ ...scoreValue, color: improved ? '#22c55e' : '#ef4444' }}>
                    {currentScore}
                  </Text>
                </td>
              </tr>
            </tbody>
          </table>
          <Text style={scoreDiffText}>
            {improved ? '+' : '-'}{scoreDiff} points
          </Text>
        </Section>

        <Text style={paragraph}>
          {improved
            ? 'Your favicon configuration is looking better. Keep up the good work!'
            : 'Review your favicon configuration to see what changed and how to fix any issues.'}
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={scanUrl}>
            View Full Report
          </Button>
        </Section>

        <Text style={unsubscribeText}>
          <Link href={unsubscribeUrl} style={unsubscribeLink}>
            Unsubscribe
          </Link>{' '}
          from monitoring alerts for {domain}
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

const scoreContainer = {
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const scoreTable = {
  margin: '0 auto',
};

const scoreCell = {
  padding: '0 20px',
  verticalAlign: 'top' as const,
};

const arrowCell = {
  padding: '0 8px',
  verticalAlign: 'middle' as const,
};

const scoreLabel = {
  fontSize: '12px',
  color: '#8898aa',
  margin: '0 0 4px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const scoreValue = {
  fontSize: '36px',
  fontWeight: '700',
  color: '#0a0a0a',
  margin: '0',
  lineHeight: '1',
};

const arrow = {
  fontSize: '24px',
  color: '#8898aa',
  margin: '0',
};

const scoreDiffText = {
  fontSize: '14px',
  color: '#8898aa',
  margin: '12px 0 0 0',
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

const unsubscribeText = {
  fontSize: '12px',
  color: '#8898aa',
  textAlign: 'center' as const,
  margin: '24px 0 0 0',
};

const unsubscribeLink = {
  color: '#8898aa',
  textDecoration: 'underline',
};

export default AlertEmail;
