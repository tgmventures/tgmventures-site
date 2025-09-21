const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const sgMail = require('@sendgrid/mail');
const {RecaptchaEnterpriseServiceClient} = require('@google-cloud/recaptcha-enterprise');

admin.initializeApp();

// Contact form submission handler
exports.submitContactForm = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    console.log('=== CONTACT FORM SUBMISSION START ===');
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    // Only allow POST requests
    if (req.method !== 'POST') {
      console.log('ERROR: Method not allowed:', req.method);
      return res.status(405).json({error: 'Method not allowed'});
    }

    try {
      const { name, email, phone, contactReason, company, message, recaptchaResponse } = req.body;
      console.log('Extracted fields:', { name, email, phone, contactReason, company, message: message?.substring(0, 50) });

      // Basic validation
      if (!name || !email || !contactReason || !message) {
        console.log('ERROR: Missing required fields:', { name: !!name, email: !!email, contactReason: !!contactReason, message: !!message });
        return res.status(400).json({error: 'Missing required fields'});
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('ERROR: Invalid email format:', email);
        return res.status(400).json({error: 'Invalid email address'});
      }

      // Verify reCAPTCHA Enterprise (optional for now)
      let score = 0.9; // Default fallback score
      
      if (recaptchaResponse && recaptchaResponse !== 'fallback-token') {
        try {
          console.log('Verifying reCAPTCHA Enterprise token...');
          const client = new RecaptchaEnterpriseServiceClient();
          const projectPath = client.projectPath('tgm-ventures-site');

          const request = {
            parent: projectPath,
            assessment: {
              event: {
                token: recaptchaResponse,
                siteKey: '6LfMddArAAAAAJCNFWRRz0lW5FlD7BJTvR5UIX9W',
              },
            },
          };

          const [response] = await client.createAssessment(request);
          
          if (response.tokenProperties?.valid) {
            score = response.riskAnalysis?.score || 0.5;
            console.log('reCAPTCHA verified successfully. Score:', score);
          } else {
            console.log('reCAPTCHA validation failed:', response.tokenProperties?.invalidReason);
          }
        } catch (recaptchaError) {
          console.error('reCAPTCHA error:', recaptchaError);
          // Continue without reCAPTCHA verification
        }
      }

      // Check if spam based on score
      if (score < 0.3) {
        console.log('ERROR: Suspected spam. Score:', score);
        return res.status(400).json({error: 'Suspicious activity detected'});
      }

      // Initialize SendGrid
      const sendgridApiKey = functions.config().sendgrid?.api_key;
      if (!sendgridApiKey) {
        console.error('ERROR: SendGrid API key not configured');
        // For now, continue without sending email
        console.log('Would send email to management@tgmventures.com');
      } else {
        sgMail.setApiKey(sendgridApiKey);

        // Prepare email
        const emailContent = {
          to: 'management@tgmventures.com',
          from: 'noreply@tgmventures.com',
          subject: `[TGM Contact Form] ${contactReason} - ${name}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Company:</strong> ${company || 'Not provided'}</p>
            <p><strong>Contact Reason:</strong> ${contactReason}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <hr>
            <p><small>Submitted at: ${new Date().toISOString()}</small></p>
            <p><small>reCAPTCHA Score: ${score}</small></p>
          `,
          text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Company: ${company || 'Not provided'}
Contact Reason: ${contactReason}

Message:
${message}

---
Submitted at: ${new Date().toISOString()}
reCAPTCHA Score: ${score}
          `
        };

        try {
          await sgMail.send(emailContent);
          console.log('Email sent successfully to management@tgmventures.com');
        } catch (emailError) {
          console.error('Email send error:', emailError);
          // Continue even if email fails
        }
      }

      // Store in Firestore
      try {
        const db = admin.firestore();
        await db.collection('contact_submissions').add({
          name,
          email,
          phone: phone || null,
          company: company || null,
          contactReason,
          message,
          recaptchaScore: score,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        });
        console.log('Contact submission stored in Firestore');
      } catch (firestoreError) {
        console.error('Firestore error:', firestoreError);
        // Continue even if Firestore fails
      }

      console.log('=== CONTACT FORM SUBMISSION SUCCESS ===');
      return res.status(200).json({
        success: true,
        message: 'Thank you for your message. We will get back to you soon!'
      });

    } catch (error) {
      console.error('ERROR:', error);
      return res.status(500).json({error: 'Internal server error'});
    }
  });
});

// Domain restriction check for authentication
exports.checkAuthDomain = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const email = context.auth.token.email;
  
  // Check domain
  if (!email || !email.endsWith('@tgmventures.com')) {
    // Log unauthorized access attempt
    try {
      const db = admin.firestore();
      await db.collection('security_logs').add({
        type: 'unauthorized_domain_access',
        email: email || 'unknown',
        uid: context.auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ip: context.rawRequest.ip
      });
    } catch (e) {
      console.error('Failed to log security event:', e);
    }

    throw new functions.https.HttpsError(
      'permission-denied',
      'Access restricted to @tgmventures.com email addresses only'
    );
  }

  return { authorized: true, email };
});
