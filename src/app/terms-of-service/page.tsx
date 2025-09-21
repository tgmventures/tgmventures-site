import LegalPageLayout from '@/components/ui/LegalPageLayout'

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout title="Terms of Service">
      <div>
        <section>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginTop: '40px',
            marginBottom: '20px',
            color: '#222',
            fontFamily: 'Poppins, sans-serif'
          }}>1. Agreement to Terms</h2>
          <p style={{
            fontSize: '16px',
            lineHeight: '1.6',
            marginBottom: '20px',
            color: '#333',
            fontFamily: 'Poppins, sans-serif'
          }}>
            By accessing and using the TGM Ventures, Inc. website (&quot;Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
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
          }}>2. Description of Service</h2>
          <p style={{
            fontSize: '16px',
            lineHeight: '1.6',
            marginBottom: '20px',
            color: '#333',
            fontFamily: 'Poppins, sans-serif'
          }}>
            TGM Ventures, Inc. is a Washington state corporation that builds, buys, and manages businesses and real estate. Our website provides information about our services, portfolio, and contact information for potential business opportunities.
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
          }}>3. Acceptable Use</h2>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginTop: '30px',
            marginBottom: '15px',
            color: '#333',
            fontFamily: 'Poppins, sans-serif'
          }}>3.1 Permitted Use</h3>
          <p style={{
            fontSize: '16px',
            lineHeight: '1.6',
            marginBottom: '15px',
            color: '#333',
            fontFamily: 'Poppins, sans-serif'
          }}>You may use our website for:</p>
          <ul style={{
            paddingLeft: '25px',
            marginBottom: '20px',
            fontFamily: 'Poppins, sans-serif'
          }}>
            <li style={{ marginBottom: '8px', color: '#333' }}>Viewing information about our services</li>
            <li style={{ marginBottom: '8px', color: '#333' }}>Contacting us for legitimate business inquiries</li>
            <li style={{ marginBottom: '8px', color: '#333' }}>Accessing publicly available content</li>
          </ul>
          
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginTop: '30px',
            marginBottom: '15px',
            color: '#333',
            fontFamily: 'Poppins, sans-serif'
          }}>3.2 Prohibited Use</h3>
          <p style={{
            fontSize: '16px',
            lineHeight: '1.6',
            marginBottom: '15px',
            color: '#333',
            fontFamily: 'Poppins, sans-serif'
          }}>You may not use our website for:</p>
          <ul style={{
            paddingLeft: '25px',
            marginBottom: '20px',
            fontFamily: 'Poppins, sans-serif'
          }}>
            <li style={{ marginBottom: '8px', color: '#333' }}>Any unlawful purpose or to solicit others to unlawful acts</li>
            <li style={{ marginBottom: '8px', color: '#333' }}>Violating any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
            <li style={{ marginBottom: '8px', color: '#333' }}>Infringing upon or violating our intellectual property rights or the intellectual property rights of others</li>
            <li style={{ marginBottom: '8px', color: '#333' }}>Harassing, abusing, insulting, harming, defaming, slandering, disparaging, intimidating, or discriminating</li>
            <li style={{ marginBottom: '8px', color: '#333' }}>Submitting false or misleading information</li>
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
          }}>4. Intellectual Property Rights</h2>
          <p style={{
            fontSize: '16px',
            lineHeight: '1.6',
            marginBottom: '20px',
            color: '#333',
            fontFamily: 'Poppins, sans-serif'
          }}>
            The Service and its original content, features, and functionality are and will remain the exclusive property of TGM Ventures, Inc. and its licensors. The Service is protected by copyright, trademark, and other laws.
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
          }}>5. Contact Information</h2>
          <p style={{
            fontSize: '16px',
            lineHeight: '1.6',
            marginBottom: '15px',
            color: '#333',
            fontFamily: 'Poppins, sans-serif'
          }}>
            If you have any questions about these Terms of Service, please{' '}
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
