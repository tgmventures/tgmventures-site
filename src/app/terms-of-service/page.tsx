import LegalPageLayout from '@/components/ui/LegalPageLayout'

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout title="Terms of Service">
      <div>
        <p style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '30px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          Effective Date: September 19, 2025 | Last Updated: September 19, 2025
        </p>
        
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginTop: '40px',
          marginBottom: '20px',
          color: '#222',
          fontFamily: 'Poppins, sans-serif'
        }}>1. AGREEMENT TO TERMS</h2>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '1.8',
          color: '#444',
          marginBottom: '15px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          These Terms of Service ("Terms") constitute a legally binding agreement between you and TGM Ventures, Inc., a Washington state corporation ("TGM Ventures," "we," "us," or "our"). By accessing our website or using our services, you agree to be bound by these Terms. If you do not agree, please do not use our website or services.
        </p>
        
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginTop: '40px',
          marginBottom: '20px',
          color: '#222',
          fontFamily: 'Poppins, sans-serif'
        }}>2. SERVICE DESCRIPTION</h2>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '1.8',
          color: '#444',
          marginBottom: '15px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          TGM Ventures is a management company that oversees various properties, businesses, and assets. Our services include comprehensive management solutions, which may involve property management, business operations oversight, maintenance coordination, and related communications including text messaging services.
        </p>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '1.8',
          color: '#444',
          marginBottom: '15px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          Our text messaging services allow us to communicate efficiently with tenants, property owners, business partners, and other stakeholders. These messages may include updates, maintenance notifications, urgent alerts, appointment confirmations, and other management-related communications.
        </p>
        
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginTop: '40px',
          marginBottom: '20px',
          color: '#222',
          fontFamily: 'Poppins, sans-serif'
        }}>3. CONSENT TO RECEIVE TEXT MESSAGES</h2>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '1.8',
          color: '#444',
          marginBottom: '15px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          By providing your mobile phone number to us, you consent to receive text messages from TGM Ventures. Message and data rates may apply, and message frequency will vary based on your interactions with us. You are responsible for any fees charged by your mobile carrier.
        </p>
        
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginTop: '40px',
          marginBottom: '20px',
          color: '#222',
          fontFamily: 'Poppins, sans-serif'
        }}>4. OPT-OUT PROCEDURES</h2>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '1.8',
          color: '#444',
          marginBottom: '15px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          You may opt out of receiving text messages at any time by replying "STOP" to any text message or by{' '}
          <a 
            href="/contact" 
            style={{
              color: '#0066cc',
              textDecoration: 'none',
              fontFamily: 'Poppins, sans-serif'
            }}
          >
            contacting us
          </a> through our website. For help with our text messaging services, reply "HELP" to any message.
        </p>

        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginTop: '40px',
          marginBottom: '20px',
          color: '#222',
          fontFamily: 'Poppins, sans-serif'
        }}>6. PRIVACY POLICY</h2>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '1.8',
          color: '#444',
          marginBottom: '15px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          Your use of our services is also governed by our{' '}
          <a 
            href="/privacy-policy" 
            style={{
              color: '#0066cc',
              textDecoration: 'none',
              fontFamily: 'Poppins, sans-serif'
            }}
          >
            Privacy Policy
          </a>, which explains how we collect, use, and protect your information.
        </p>

        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginTop: '40px',
          marginBottom: '20px',
          color: '#222',
          fontFamily: 'Poppins, sans-serif'
        }}>18. CONTACT INFORMATION</h2>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '1.8',
          color: '#444',
          marginBottom: '15px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          If you have any questions about these Terms, please{' '}
          <a 
            href="/contact" 
            style={{
              color: '#0066cc',
              textDecoration: 'none',
              fontFamily: 'Poppins, sans-serif'
            }}
          >
            contact us
          </a> through our website.
        </p>
        
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          margin: '20px 0'
        }}>
          <p style={{
            fontSize: '16px',
            lineHeight: '1.8',
            color: '#444',
            margin: 0,
            fontFamily: 'Poppins, sans-serif'
          }}>
            <strong style={{ fontWeight: '600', color: '#222' }}>TGM Ventures, Inc.</strong><br />
            Attn: Legal Department<br />
            Website:{' '}
            <a 
              href="https://tgmventures.com"
              style={{
                color: '#0066cc',
                textDecoration: 'none',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              tgmventures.com
            </a><br />
            Contact:{' '}
            <a 
              href="/contact"
              style={{
                color: '#0066cc',
                textDecoration: 'none',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              Contact Form
            </a>
          </p>
        </div>
      </div>
    </LegalPageLayout>
  )
}