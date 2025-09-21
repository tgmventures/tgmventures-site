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

      // Verify reCAPTCHA Enterprise
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
                expectedAction: 'CONTACT_FORM',
              },
            },
          };

          const [response] = await client.createAssessment(request);
          
          if (!response.tokenProperties.valid) {
            console.log('Invalid reCAPTCHA token');
            return res.status(400).json({error: 'reCAPTCHA verification failed'});
          }

          if (response.tokenProperties.action !== 'CONTACT_FORM') {
            console.log('Invalid reCAPTCHA action');
            return res.status(400).json({error: 'Invalid reCAPTCHA action'});
          }

          score = response.riskAnalysis.score;
          console.log('reCAPTCHA Enterprise score:', score);
          
          if (score < 0.5) {
            console.log('Low reCAPTCHA score:', score);
            return res.status(400).json({error: 'reCAPTCHA verification failed - please try again'});
          }
          
        } catch (error) {
          console.error('reCAPTCHA verification error:', error);
          // Continue with fallback score for now
          console.log('Using fallback score due to reCAPTCHA error');
        }
      } else {
        console.log('Using fallback reCAPTCHA score (no token provided)');
      }

      // Store submission in Firestore
      const submission = {
        name,
        email,
        phone: phone || '',
        contactReason,
        company: company || '',
        message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ip: req.ip,
        userAgent: req.get('User-Agent') || '',
        recaptchaScore: score
      };

      console.log('Attempting to save to Firestore...');
      await admin.firestore().collection('contactSubmissions').add(submission);
      console.log('SUCCESS: Saved to Firestore');

      console.log('Attempting to send email...');
      await sendEmailNotification(submission);
      console.log('SUCCESS: Email sent');

      console.log('=== CONTACT FORM SUBMISSION COMPLETE ===');
      console.log('Contact form submitted successfully:', { name, email, contactReason });

      return res.status(200).json({
        success: true,
        message: 'Thank you for your message! We\'ll get back to you soon.'
      });

    } catch (error) {
      console.error('=== CONTACT FORM ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      return res.status(500).json({error: `Internal server error: ${error.message}`});
    }
  });
});

// Email notification function using SendGrid
async function sendEmailNotification(submission) {
  try {
    // Get SendGrid API key from Firebase Functions config
    const sendgridConfig = functions.config().sendgrid;
    
    if (!sendgridConfig || !sendgridConfig.api_key) {
      console.error('ERROR: SendGrid API key not configured');
      throw new Error('SendGrid API key not configured');
    }

    // Set SendGrid API key
    sgMail.setApiKey(sendgridConfig.api_key);

    const contactReasonLabels = {
      'general': 'General Inquiry',
      'property-management': 'Property Management Inquiry',
      'business-management': 'Business Management Services',
      'investment-opportunity': 'Investment Opportunity',
      'media-press': 'Media & Press'
    };

    const emailContent = {
      to: 'management@tgmventures.com',
      from: {
        email: 'noreply@tgmventures.com',
        name: 'TGM Ventures Website'
      },
      replyTo: {
        email: submission.email,
        name: submission.name
      },
      subject: `New Contact Form Submission - ${contactReasonLabels[submission.contactReason] || submission.contactReason}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #000000; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">TGM Ventures</h1>
            <p style="color: #cccccc; margin: 5px 0 0 0; font-size: 14px;">New Contact Form Submission</p>
          </div>
          
          <div style="padding: 30px;">
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #007bff;">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">Contact Information</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555; width: 30%;">Name:</td>
                  <td style="padding: 8px 0; color: #333;">${submission.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
                  <td style="padding: 8px 0;"><a href="mailto:${submission.email}" style="color: #007bff; text-decoration: none;">${submission.email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Phone:</td>
                  <td style="padding: 8px 0; color: #333;">${submission.phone || 'Not provided'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Company:</td>
                  <td style="padding: 8px 0; color: #333;">${submission.company || 'Not provided'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Inquiry Type:</td>
                  <td style="padding: 8px 0; color: #333;">${contactReasonLabels[submission.contactReason] || submission.contactReason}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #ffffff; padding: 25px; border: 2px solid #e9ecef; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Message:</h3>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; line-height: 1.6; color: #555; white-space: pre-wrap;">${submission.message}</div>
            </div>
            
            <div style="background-color: #e9ecef; padding: 20px; border-radius: 8px; font-size: 13px; color: #666;">
              <h4 style="margin: 0 0 10px 0; color: #555;">Security & Technical Details</h4>
              <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date().toLocaleString('en-US', {timeZone: 'America/Los_Angeles'})}</p>
              <p style="margin: 5px 0;"><strong>reCAPTCHA Score:</strong> ${submission.recaptchaScore} <span style="color: ${submission.recaptchaScore > 0.7 ? '#28a745' : submission.recaptchaScore > 0.5 ? '#ffc107' : '#dc3545'};">(${submission.recaptchaScore > 0.7 ? 'Very Safe' : submission.recaptchaScore > 0.5 ? 'Safe' : 'Moderate Risk'})</span></p>
              <p style="margin: 5px 0;"><strong>IP Address:</strong> ${submission.ip}</p>
              <p style="margin: 5px 0;"><strong>User Agent:</strong> ${submission.userAgent}</p>
            </div>
            
            <div style="margin-top: 25px; padding: 15px; background-color: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
              <p style="margin: 0; color: #155724; font-size: 14px;">
                <strong>💡 Pro Tip:</strong> You can reply directly to this email - it will go to ${submission.email}
              </p>
            </div>
          </div>
          
          <div style="background-color: #000000; padding: 15px; text-align: center;">
            <p style="color: #cccccc; margin: 0; font-size: 12px;">
              Automated message from TGM Ventures website contact form
            </p>
          </div>
        </div>
      `
    };

    console.log('SendGrid email content:', JSON.stringify(emailContent, null, 2));
    
    const result = await sgMail.send(emailContent);
    console.log('SendGrid response:', result);
    console.log(`Email sent successfully via SendGrid to webcontact@tgmventures.com for submission from ${submission.email}`);
    
  } catch (error) {
    console.error('=== SENDGRID ERROR ===');
    console.error('SendGrid error details:', error);
    console.error('SendGrid error message:', error.message);
    console.error('SendGrid error response:', error.response?.body);
    throw error; // Throw error so we know email failed
  }
}

// Health check endpoint
exports.healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({status: 'OK', timestamp: new Date().toISOString()});
});

// Firebase Auth trigger to validate and clean up unauthorized users
exports.validateUserDomain = functions.auth.user().onCreate((user) => {
  console.log('=== FIREBASE AUTH VALIDATION ===');
  console.log('New user created:', user.email);
  console.log('User domain:', user.email ? user.email.split('@')[1] : 'no email');
  
  // Check if user email is from authorized domain
  if (!user.email || !user.email.endsWith('@tgmventures.com')) {
    console.log('UNAUTHORIZED: Deleting user with invalid domain:', user.email);
    
    // Delete the user account immediately
    return admin.auth().deleteUser(user.uid)
      .then(() => {
        console.log('Successfully deleted unauthorized user:', user.email);
        
        // Log the security incident
        return admin.firestore().collection('securityLogs').add({
          type: 'unauthorized_access_attempt',
          email: user.email,
          uid: user.uid,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          action: 'user_deleted'
        });
      })
      .catch((error) => {
        console.error('Error deleting unauthorized user:', error);
        throw error;
      });
  }
  
  console.log('AUTHORIZED: User domain validated:', user.email);
  
  // Set custom claims for authorized users
  return admin.auth().setCustomUserClaims(user.uid, {
    domain: 'tgmventures.com',
    role: 'team_member',
    authorized: true
  }).then(() => {
    console.log('Custom claims set for authorized user:', user.email);
    
    // Log the successful authorization
    return admin.firestore().collection('securityLogs').add({
      type: 'authorized_user_created',
      email: user.email,
      uid: user.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      action: 'user_authorized'
    });
  });
});

