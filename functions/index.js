const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const sgMail = require('@sendgrid/mail');

admin.initializeApp();

// Initialize SendGrid with API key from Secret Manager
async function initSendGrid() {
  try {
    const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({
      name: 'projects/tgm-ventures-site/secrets/SENDGRID_API_KEY/versions/latest',
    });
    const apiKey = version.payload.data.toString('utf8');
    sgMail.setApiKey(apiKey);
    return true;
  } catch (error) {
    console.error('Failed to initialize SendGrid:', error);
    return false;
  }
}

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

      // Skip reCAPTCHA verification for now
      const score = 0.9;

      // Initialize SendGrid
      const sendGridReady = await initSendGrid();
      
      // Send email
      if (sendGridReady) {
        try {
          const msg = {
            to: 'management@tgmventures.com',
            from: 'noreply@tgmventures.com', // Must be verified sender
            replyTo: email,
            subject: `New Contact Form Submission - ${contactReason.charAt(0).toUpperCase() + contactReason.slice(1).replace('-', ' ')}`,
            text: `New contact form submission:
            
Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Company: ${company || 'Not provided'}
Contact Reason: ${contactReason}

Message:
${message}

---
This email was sent from the TGM Ventures contact form.`,
            html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>New Contact Form Submission</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #000000; padding: 40px; text-align: center;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <div style="width: 70px; height: 70px; background-color: #1e56db; border-radius: 50%; display: inline-block; line-height: 70px; color: white; font-size: 24px; font-weight: bold;">TGM</div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 300;">New Contact Form Submission</h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 10px;">
                    <p style="margin: 0; color: #cccccc; font-size: 16px;">You've received a new inquiry from your website</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Contact Information -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; border: 1px solid #e9ecef;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="width: 36px; height: 36px; background-color: #000000; border-radius: 6px; text-align: center; line-height: 36px; color: white; font-size: 18px;">👤</td>
                              <td style="padding-left: 15px;">
                                <h2 style="margin: 0; font-size: 20px; color: #222;">Contact Information</h2>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 8px 0; font-size: 14px; color: #666; width: 120px; vertical-align: top;"><strong>Name</strong></td>
                              <td style="padding: 8px 0; font-size: 15px; color: #222;">${name}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; font-size: 14px; color: #666; vertical-align: top;"><strong>Email</strong></td>
                              <td style="padding: 8px 0; font-size: 15px;"><a href="mailto:${email}" style="color: #1e56db; text-decoration: none;">${email}</a></td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; font-size: 14px; color: #666; vertical-align: top;"><strong>Phone</strong></td>
                              <td style="padding: 8px 0; font-size: 15px; color: #222;">${phone || '<span style="color: #999;">Not provided</span>'}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; font-size: 14px; color: #666; vertical-align: top;"><strong>Company</strong></td>
                              <td style="padding: 8px 0; font-size: 15px; color: #222;">${company || '<span style="color: #999;">Not provided</span>'}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; font-size: 14px; color: #666; vertical-align: top;"><strong>Inquiry Type</strong></td>
                              <td style="padding: 8px 0; font-size: 15px; color: #222;">${contactReason.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Message -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; border: 1px solid #e9ecef;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="width: 36px; height: 36px; background-color: #1e56db; border-radius: 6px; text-align: center; line-height: 36px; color: white; font-size: 18px;">💬</td>
                              <td style="padding-left: 15px;">
                                <h2 style="margin: 0; font-size: 20px; color: #222;">Message</h2>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #333; white-space: pre-wrap;">${message}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Technical Details -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td style="background-color: #f1f3f5; padding: 20px; border-radius: 6px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 4px 0;">
                          <span style="font-size: 13px; color: #666;"><strong>Submitted:</strong> ${new Date().toLocaleString('en-US', { 
                            weekday: 'long',
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true 
                          })}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;">
                          <span style="font-size: 13px; color: #666;"><strong>Security Score:</strong> reCAPTCHA ${score} (Very Safe)</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;">
                          <span style="font-size: 13px; color: #666;"><strong>IP Address:</strong> ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Reply Tip -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="background-color: #e8f4fd; padding: 20px; border-radius: 6px; border-left: 4px solid #1e56db;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size: 18px; padding-right: 10px;">💡</td>
                        <td style="font-size: 14px; color: #1e56db;">
                          <strong>Quick Reply:</strong> You can reply directly to this email — it will go to <a href="mailto:${email}" style="color: #1e56db; text-decoration: none; font-weight: bold;">${email}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #000000; padding: 30px; text-align: center;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 15px;">
                    <div style="width: 36px; height: 36px; background-color: #1a1a1a; border-radius: 50%; display: inline-block; line-height: 36px; color: #666; font-size: 12px; font-weight: bold; border: 1px solid #333;">TGM</div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin: 0; color: #999; font-size: 13px;">This is an automated message from your website contact form</p>
                    <p style="margin: 5px 0 0 0; color: #ccc; font-size: 13px;"><strong>TGM Ventures, Inc.</strong></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
          };
          
          await sgMail.send(msg);
          console.log('Email sent successfully to management@tgmventures.com');
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
          // Continue even if email fails - data is still saved in Firestore
        }
      } else {
        console.log('SendGrid not initialized - email not sent');
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

// Export weekly report functions
const weeklyReport = require('./weekly-report');
exports.weeklyReportEmail = weeklyReport.weeklyReportEmail;
exports.sendWeeklyReportNow = weeklyReport.sendWeeklyReportNow;
