import LegalPageLayout from '@/components/ui/LegalPageLayout'

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <div>
        <section>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginTop: '40px',
            marginBottom: '20px',
            color: '#222',
            fontFamily: 'Poppins, sans-serif'
          }}>1. Introduction</h2>
          <p style={{
            fontSize: '16px',
            lineHeight: '1.6',
            marginBottom: '20px',
            color: '#333',
            fontFamily: 'Poppins, sans-serif'
          }}>
            TGM Ventures, Inc. (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
          </p>
        </section>

        <section>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginTop: '40px',
            marginBottom: '20px',
            color: '#222',
            fontFamily: 'Poppins, sans-serif'
          }}>2. Information We Collect</h2>
          <p style={{
            fontSize: '16px',
            lineHeight: '1.6',
            marginBottom: '15px',
            color: '#333',
            fontFamily: 'Poppins, sans-serif'
          }}>We collect information in the following ways:</p>
          
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginTop: '30px',
            marginBottom: '15px',
            color: '#333',
            fontFamily: 'Poppins, sans-serif'
          }}>2.1 Information You Provide</h3>
          <ul style={{
            paddingLeft: '25px',
            marginBottom: '20px',
            fontFamily: 'Poppins, sans-serif'
          }}>
            <li style={{ marginBottom: '8px', color: '#333' }}>Contact information (name, email address, phone number)</li>
            <li style={{ marginBottom: '8px', color: '#333' }}>Business information and inquiries</li>
            <li style={{ marginBottom: '8px', color: '#333' }}>Any other information you voluntarily provide</li>
          </ul>
          
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginTop: '30px',
            marginBottom: '15px',
            color: '#333',
            fontFamily: 'Poppins, sans-serif'
          }}>2.2 Automatically Collected Information</h3>
          <ul style={{
            paddingLeft: '25px',
            marginBottom: '20px',
            fontFamily: 'Poppins, sans-serif'
          }}>
            <li style={{ marginBottom: '8px', color: '#333' }}>IP address and location data</li>
            <li style={{ marginBottom: '8px', color: '#333' }}>Browser type and version</li>
            <li style={{ marginBottom: '8px', color: '#333' }}>Device information</li>
            <li style={{ marginBottom: '8px', color: '#333' }}>Website usage patterns and analytics</li>
            <li style={{ marginBottom: '8px', color: '#333' }}>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginTop: '40px',
            marginBottom: '20px',
            color: '#222',
            fontFamily: 'Poppins, sans-serif'
          }}>3. Contact Us</h2>
          <p style={{
            fontSize: '16px',
            lineHeight: '1.6',
            marginBottom: '15px',
            color: '#333',
            fontFamily: 'Poppins, sans-serif'
          }}>
            If you have questions about this Privacy Policy or our privacy practices, please{' '}
            <a 
              href="/contact" 
              style={{
                color: '#007bff',
                textDecoration: 'underline',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              contact us
            </a>.
          </p>
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            padding: '20px',
            marginTop: '20px',
            border: '1px solid #e9ecef'
          }}>
            <p style={{
              color: '#333',
              margin: 0,
              fontFamily: 'Poppins, sans-serif',
              lineHeight: '1.6',
              fontSize: '16px'
            }}>
              <strong>TGM Ventures, Inc.</strong><br />
              Email: management@tgmventures.com<br />
              Website: www.tgmventures.com
            </p>
          </div>
        </section>
      </div>
    </LegalPageLayout>
  )
}
