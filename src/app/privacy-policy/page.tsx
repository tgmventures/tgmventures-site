import LegalPageLayout from '@/components/ui/LegalPageLayout'

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <div>
        <p style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '30px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          Effective Date: September 19, 2025 | Last Updated: September 19, 2025
        </p>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '1.8',
          color: '#444',
          marginBottom: '15px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          TGM Ventures, Inc., a Washington state corporation ("TGM Ventures," "Company," "we," "us," or "our"), is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or engage with our services.
        </p>
        
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginTop: '40px',
          marginBottom: '20px',
          color: '#222',
          fontFamily: 'Poppins, sans-serif'
        }}>1. INFORMATION WE COLLECT</h2>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '1.8',
          color: '#444',
          marginBottom: '15px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          We collect information you provide directly to us when you visit our website, communicate with us, or use our property and business management services. This includes contact information such as your name, email address, phone number, and mailing address. When you provide your mobile phone number through our website or other communications, we may use it to send and receive text messages related to our management services.
        </p>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '1.8',
          color: '#444',
          marginBottom: '15px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          We also automatically collect certain information about your device when you visit our website, including your IP address, browser type, operating system, and browsing behavior. This helps us improve our website and services.
        </p>
        
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginTop: '40px',
          marginBottom: '20px',
          color: '#222',
          fontFamily: 'Poppins, sans-serif'
        }}>2. HOW WE USE YOUR INFORMATION</h2>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '1.8',
          color: '#444',
          marginBottom: '15px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          We use the information we collect to provide and improve our management services for the various properties and businesses we oversee. This includes communicating with you about our services, responding to your inquiries, sending important updates and notifications, and fulfilling our obligations as a management company.
        </p>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '1.8',
          color: '#444',
          marginBottom: '15px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          For text messaging specifically, we may send you property management communications, maintenance notifications, community updates, urgent alerts, appointment confirmations, and other service-related messages. Message frequency varies based on your needs and interactions with our managed properties or businesses.
        </p>

        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginTop: '40px',
          marginBottom: '20px',
          color: '#222',
          fontFamily: 'Poppins, sans-serif'
        }}>3. TEXT MESSAGING TERMS</h2>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '1.8',
          color: '#444',
          marginBottom: '15px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          By providing your mobile phone number, you consent to receive text messages from TGM Ventures at the number provided. Standard message and data rates may apply, and you are responsible for any charges from your wireless carrier.
        </p>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '1.8',
          color: '#444',
          marginBottom: '15px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          You may opt out of receiving text messages at any time by replying "STOP" to any message. For help, reply "HELP". Our text messaging services comply with CTIA guidelines.
        </p>

        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginTop: '40px',
          marginBottom: '20px',
          color: '#222',
          fontFamily: 'Poppins, sans-serif'
        }}>4. DATA SHARING AND DISCLOSURE</h2>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '1.8',
          color: '#444',
          marginBottom: '15px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          We do not sell, trade, or rent your personal information to third parties for their marketing purposes. We may share your information with service providers who assist us in operating our business, such as property management software providers (including Rent Manager), maintenance contractors, and communication platforms. These providers are bound by confidentiality agreements and are only permitted to use your information as necessary to provide services to us.
        </p>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '1.8',
          color: '#444',
          marginBottom: '15px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          We may also disclose your information when required by law, to protect our rights or property, or in connection with a business transfer.
        </p>

        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginTop: '40px',
          marginBottom: '20px',
          color: '#222',
          fontFamily: 'Poppins, sans-serif'
        }}>12. CONTACT INFORMATION</h2>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '1.8',
          color: '#444',
          marginBottom: '15px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          If you have questions about this Privacy Policy or our privacy practices, please{' '}
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