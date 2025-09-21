# DNS Migration Guide - tgmventures.com to Firebase

## 🎯 **Objective**
Migrate `tgmventures.com` from GitHub Pages to Firebase Hosting while maintaining zero downtime and preserving all functionality.

## 📋 **Pre-Migration Checklist**

### **✅ Current Status**
- [x] Firebase hosting working at `https://tgm-ventures-site.web.app`
- [x] Contact form functional with reCAPTCHA Enterprise
- [x] SendGrid email delivery to `management@tgmventures.com`
- [x] All legacy projects preserved and functional
- [x] GitHub repository updated with V2 structure

### **🔍 Current DNS Setup (GitHub Pages)**
```
Type: A Record
Name: @ (or blank)
Value: GitHub Pages IP addresses
TTL: Usually 3600 (1 hour)

Type: CNAME
Name: www
Value: username.github.io
TTL: Usually 3600 (1 hour)
```

## 🚀 **Migration Steps**

### **Step 1: Add Custom Domain in Firebase**
1. **Go to**: [Firebase Console - Hosting](https://console.firebase.google.com/project/tgm-ventures-site/hosting/main)
2. **Click**: "Add custom domain"
3. **Enter**: `tgmventures.com`
4. **Choose**: "Redirect www.tgmventures.com to tgmventures.com" (recommended)
5. **Click**: "Continue"

### **Step 2: Domain Verification**
Firebase will provide a TXT record for verification:
```
Type: TXT
Name: @ (or blank)
Value: firebase-verification-code-here
TTL: 300 (5 minutes for faster verification)
```

**Add this TXT record first, then continue in Firebase Console.**

### **Step 3: Get DNS Instructions**
Firebase will provide specific DNS records, typically:

**For Root Domain:**
```
Type: A
Name: @ (or blank)
Value: 151.101.1.195
TTL: 3600

Type: A  
Name: @ (or blank)
Value: 151.101.65.195
TTL: 3600
```

**For WWW (if using):**
```
Type: CNAME
Name: www
Value: tgm-ventures-site.web.app
TTL: 3600
```

### **Step 4: Update DNS Records**
1. **Log into your domain registrar** (GoDaddy, Namecheap, etc.)
2. **Go to DNS Management** for tgmventures.com
3. **Replace existing A records** with Firebase IP addresses
4. **Update CNAME records** as instructed
5. **Save changes**

### **Step 5: Verification & SSL**
- **Wait 5-15 minutes** for DNS propagation
- **Firebase automatically verifies** domain ownership
- **SSL certificate** automatically provisioned
- **Site goes live** on tgmventures.com

## ⚠️ **Migration Considerations**

### **Timing**
- **Best Time**: Off-peak hours (evening/weekend)
- **DNS Propagation**: 5 minutes to 24 hours (usually 15 minutes)
- **SSL Provisioning**: 5-10 minutes after DNS verification
- **Total Downtime**: Minimal (usually <5 minutes)

### **Backup Plan**
- **Keep GitHub Pages active** until Firebase is confirmed working
- **Test Firebase URL** thoroughly before DNS switch
- **Have registrar login ready** for quick DNS rollback if needed

### **Testing Checklist**
Before DNS migration, verify on `tgm-ventures-site.web.app`:
- [ ] Homepage loads correctly
- [ ] Privacy Policy and Terms accessible
- [ ] Contact form submits successfully
- [ ] Email delivery to management@tgmventures.com
- [ ] reCAPTCHA Enterprise functioning
- [ ] Mobile responsiveness
- [ ] All navigation links working

## 🔍 **Post-Migration Verification**

### **DNS Propagation Check**
```bash
# Check if DNS has propagated
dig tgmventures.com A
nslookup tgmventures.com

# Should show Firebase IP addresses:
# 151.101.1.195
# 151.101.65.195
```

### **SSL Certificate Verification**
```bash
# Check SSL certificate
openssl s_client -connect tgmventures.com:443 -servername tgmventures.com
```

### **Functionality Testing**
- [ ] **Homepage**: https://tgmventures.com
- [ ] **Contact Form**: https://tgmventures.com/contact.html
- [ ] **Privacy Policy**: https://tgmventures.com/privacy-policy.html
- [ ] **Terms of Service**: https://tgmventures.com/terms-of-service.html
- [ ] **HTTPS Redirect**: http://tgmventures.com → https://tgmventures.com
- [ ] **WWW Redirect**: www.tgmventures.com → tgmventures.com

## 📊 **Performance Benefits**

### **Firebase vs GitHub Pages**
| Feature | GitHub Pages | Firebase Hosting |
|---------|-------------|------------------|
| **SSL** | Basic | Advanced with HTTP/2 |
| **CDN** | Limited | Global Google CDN |
| **Custom Headers** | No | Yes |
| **Redirects** | Limited | Full control |
| **Functions** | No | Yes (contact form) |
| **Analytics** | Basic | Advanced |
| **Uptime** | 99.9% | 99.95% |

### **Expected Improvements**
- **Faster Load Times** → Google's global CDN
- **Better SEO** → Improved performance scores
- **Enhanced Security** → Advanced SSL and headers
- **Dynamic Features** → Contact form, future dashboard
- **Better Analytics** → Firebase Analytics integration

## 🛠️ **Troubleshooting**

### **Common Issues**

**DNS Not Propagating:**
- Check TTL values (lower = faster propagation)
- Use online DNS checker tools
- Clear local DNS cache: `sudo dscacheutil -flushcache`

**SSL Certificate Issues:**
- Ensure DNS is fully propagated first
- Wait 10-15 minutes after DNS verification
- Check Firebase Console for certificate status

**Site Not Loading:**
- Verify DNS records match Firebase instructions exactly
- Check for typos in IP addresses
- Ensure old GitHub Pages DNS is fully replaced

**Contact Form Not Working:**
- Verify Firebase Functions are deployed
- Check reCAPTCHA Enterprise configuration
- Test SendGrid email delivery

## 📞 **Support Resources**

### **Firebase Support**
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Custom Domain Setup](https://firebase.google.com/docs/hosting/custom-domain)
- [Firebase Console](https://console.firebase.google.com/project/tgm-ventures-site)

### **DNS Tools**
- [DNS Checker](https://dnschecker.org/)
- [What's My DNS](https://www.whatsmydns.net/)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)

---

**This migration will provide TGM Ventures with enterprise-grade hosting infrastructure while maintaining the professional, simple aesthetic that defines the brand.**
