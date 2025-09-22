# 🔐 SECURITY GUIDELINES - TGM VENTURES

## 🚨 CRITICAL SECURITY RULES

### **NEVER COMMIT SENSITIVE DATA**
- API keys, tokens, passwords, secrets
- Database credentials or connection strings
- Private keys, certificates, or authentication files
- User data, email addresses, or personal information
- Internal URLs, server details, or infrastructure info

### **ALWAYS USE SECRET MANAGER**
- All API keys stored in Google Secret Manager
- Fetch secrets at runtime, never hardcode
- Use provided scripts for local development
- Environment variables only for build-time configuration

## 📋 SECURITY CHECKLIST

### **Before Every Commit:**
- [ ] Search for API keys: `grep -r "AIza\|sk_\|pk_\|secret\|password" . --exclude-dir=node_modules --exclude-dir=.next`
- [ ] Check for exposed tokens: `grep -r "token\|key.*=" . --include="*.js" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules`
- [ ] Verify no `.env.local` or `config.js` files are staged
- [ ] Ensure `.gitignore` includes all sensitive files
- [ ] Test that application works without local secrets

### **Code Review Requirements:**
- [ ] No hardcoded credentials in any file
- [ ] All sensitive data loaded from Secret Manager
- [ ] Error messages don't expose internal details
- [ ] No debug information in production code
- [ ] Authentication properly restricts access

## 🛡️ CURRENT SECURITY IMPLEMENTATION

### **Secret Management:**
```bash
# Local development - secrets fetched at runtime
./scripts/start-local.sh

# Production deployment - secrets from Secret Manager
NEXT_PUBLIC_FIREBASE_API_KEY=$(gcloud secrets versions access latest --secret="FIREBASE_API_KEY") firebase deploy
```

### **Authentication:**
- Google OAuth only
- Domain restriction: @tgmventures.com
- Session management via Firebase Auth
- Protected routes redirect to login

### **API Security:**
- All API endpoints require authentication
- CORS configured for production domain
- Rate limiting on contact form
- reCAPTCHA protection on public forms

## 🔍 SECURITY MONITORING

### **Regular Security Audits:**
- Weekly scan for exposed secrets in codebase
- Monthly dependency vulnerability check: `npm audit`
- Quarterly Firebase security rules review
- Annual authentication policy review

### **Incident Response:**
1. **IMMEDIATE**: Remove exposed credentials from code
2. **URGENT**: Rotate compromised keys in Secret Manager
3. **PRIORITY**: Deploy fixes to production
4. **FOLLOW-UP**: Document incident and update procedures

## ⚠️ COMMON SECURITY MISTAKES TO AVOID

### **DON'T DO THIS:**
```javascript
// ❌ NEVER hardcode API keys
const apiKey = "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

// ❌ NEVER commit environment files
// .env.local with real keys

// ❌ NEVER log sensitive data
console.log("API Key:", process.env.FIREBASE_API_KEY);

// ❌ NEVER expose internal errors
catch (error) {
  res.status(500).json({ error: error.message, stack: error.stack });
}
```

### **DO THIS INSTEAD:**
```javascript
// ✅ Load from environment (injected by Secret Manager)
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// ✅ Use .env.example for documentation
// Copy .env.example to .env.local and add your keys

// ✅ Log safely without exposing data
console.log("API Key loaded:", apiKey ? "✓" : "✗");

// ✅ Return generic error messages
catch (error) {
  console.error("Internal error:", error);
  res.status(500).json({ error: "An error occurred" });
}
```

## 🔐 Firebase Security Rules

### **Firestore Rules:**
- Authenticated users only
- Users can only read/write their organization's data
- No public read/write access
- Regularly review and update rules

### **Example Secure Rule:**
```javascript
match /organizations/{orgId} {
  allow read, write: if request.auth != null 
    && request.auth.token.email.matches('.*@tgmventures.com');
}
```

## 📊 Security Dependencies

### **Critical Services:**
- **Google Secret Manager**: API key storage
- **Firebase Auth**: User authentication
- **Firebase Security Rules**: Database access control
- **reCAPTCHA**: Bot protection
- **SendGrid**: Secure email delivery

### **Monitoring:**
- Firebase Console for auth events
- Cloud Functions logs for API access
- Secret Manager audit logs
- GitHub security alerts

## 🚨 Emergency Procedures

### **Compromised API Key:**
1. Go to [Google Secret Manager](https://console.cloud.google.com/security/secret-manager)
2. Create new version of compromised secret
3. Delete/disable old version
4. Redeploy all services
5. Monitor for unauthorized usage

### **Suspicious Activity:**
1. Check Firebase Auth logs
2. Review Firestore access patterns
3. Temporarily disable affected features
4. Investigate and patch vulnerabilities
5. Re-enable with additional monitoring

## 📞 Security Contacts

**For Security Issues:**
- Create private GitHub issue
- Contact project maintainer directly
- For emergencies: Disable affected services first

**Security Resources:**
- [Firebase Security Checklist](https://firebase.google.com/docs/security/checklist)
- [Google Cloud Security Best Practices](https://cloud.google.com/security/best-practices)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Remember**: Security is not optional. Every team member is responsible for maintaining these security standards. When in doubt, ask for review before proceeding.