const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});

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

      // Skip reCAPTCHA verification for now
      const score = 0.9;

      // Log email details (SendGrid integration can be added later)
      console.log('Contact form submission:', {
        to: 'management@tgmventures.com',
        subject: `[TGM Contact Form] ${contactReason} - ${name}`,
        from: email,
        body: { name, email, phone, company, contactReason, message }
      });

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
