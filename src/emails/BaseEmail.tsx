import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components';

interface BaseEmailProps {
  preview: string;
  children: React.ReactNode;
}

export function BaseEmail({ preview, children }: BaseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>FaviconLint</Text>
          </Section>

          {children}

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              This email was sent by{' '}
              <Link href="https://faviconlint.com" style={footerLink}>
                FaviconLint
              </Link>
              , a free favicon checker tool.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  marginBottom: '64px',
  maxWidth: '560px',
};

const header = {
  padding: '0 0 20px 0',
};

const logo = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#0a0a0a',
  margin: '0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
};

const footer = {
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '12px',
  color: '#8898aa',
  margin: '0',
  lineHeight: '20px',
};

const footerLink = {
  color: '#3b82f6',
  textDecoration: 'none',
};
