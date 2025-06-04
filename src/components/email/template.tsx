import { Body, Container, Head, Html, Img, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';

interface EmailTemplateProps {
  name: string;
  firstText: string;
  secondText: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  name,
  firstText,
  secondText,
}) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>{firstText}</Preview>
      <Container style={container}>
        <Section style={logoSection}>
          <Img
            src={`https://www.im-vestor.com/logo/imvestor.png`}
            width="48"
            height="48"
            alt="Im-Vestor"
            style={logo}
          />
        </Section>
        <Text style={heading}>Hey, {name}!</Text>
        <Text style={paragraph}>{firstText}</Text>
        <Text style={secondaryText}>{secondText}</Text>
      </Container>
    </Body>
  </Html>
);

export default EmailTemplate;

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  maxWidth: '600px',
};

const logoSection = {
  textAlign: 'center' as const,
  margin: '0 0 20px 0',
};

const logo = {
  margin: '0 auto',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '20px 0',
  color: '#1f2937',
};

const paragraph = {
  fontSize: '14px',
  lineHeight: '20px',
  textAlign: 'center' as const,
  margin: '10px 0',
  color: '#374151',
};

const secondaryText = {
  fontSize: '14px',
  lineHeight: '20px',
  textAlign: 'center' as const,
  margin: '10px 0',
  color: '#6b7280',
};
