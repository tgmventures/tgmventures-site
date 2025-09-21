# 🔐 TGM Ventures Security Checklist

## Pre-Commit Security Scan

**MANDATORY: Run this checklist before every commit and push to GitHub**

### 1. API Key Scan
```bash
# Search for hardcoded API keys
grep -r "AIza\|sk_\|pk_" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git

# Search for common secrets
grep -r "secret\|password\|token.*=" . --include="*.js" --include="*.ts" --include="*.md" --exclude-dir=node_modules
```

### 2. Environment Variable Check
- [ ] All sensitive data uses environment variables
- [ ] `.env.local` exists and contains actual values
- [ ] `env.example` exists with placeholder values
- [ ] No `.env` files are committed to git

### 3. Firebase Security
- [ ] Firebase config uses `process.env.NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] No hardcoded Firebase credentials in any file
- [ ] Firebase domain restrictions are enabled

### 4. Documentation Security
- [ ] No API keys in README.md
- [ ] No API keys in DEPLOYMENT.md
- [ ] No sensitive URLs or credentials in planning docs

### 5. .gitignore Verification
```bash
# Verify sensitive files are ignored
git check-ignore .env.local config.js
```

## Security Incident Response

If you find exposed credentials:

1. **STOP** - Don't commit anything else
2. **REMOVE** the exposed credentials from all files
3. **REVOKE** the compromised keys/tokens in their respective consoles
4. **GENERATE** new credentials
5. **UPDATE** environment variables with new credentials
6. **VERIFY** the application still works
7. **DOCUMENT** the incident in this file

## Security Best Practices

### ✅ DO:
- Use environment variables for all secrets
- Keep sensitive data in `.env.local` (gitignored)
- Provide example files with placeholders
- Regularly audit for exposed credentials
- Use domain restrictions on API keys
- Implement least privilege access

### ❌ DON'T:
- Hardcode API keys in source code
- Commit `.env` files to version control
- Put credentials in documentation
- Log sensitive information
- Use production keys in development
- Share API keys via insecure channels

## Emergency Contacts

- **Firebase Console**: https://console.firebase.google.com/project/tgm-ventures-site
- **Google Cloud Console**: https://console.cloud.google.com/
- **Vercel Dashboard**: https://vercel.com/dashboard

---

**Last Security Audit**: [Date of last comprehensive security check]
**Next Audit Due**: [Schedule regular security audits]
