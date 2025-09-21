# TGM Ventures Phase 3: Internal Team Dashboard

## 🎯 Project Vision

Create a secure, internal dashboard for TGM Ventures team members that provides centralized access to all company tools and applications through a beautiful, iOS-style interface.

## 🔐 Authentication Strategy

### **Google Workspace Integration**
- **Restriction**: Only `@tgmventures.com` email addresses
- **Method**: Google OAuth with domain restriction
- **Security**: Firebase Authentication with custom claims
- **Session Management**: Secure, persistent login sessions

### **Login Flow**
1. **Homepage**: Add "Team Login" button (top-right or above footer)
2. **Click Login** → Redirect to Google OAuth
3. **Domain Validation** → Only allow @tgmventures.com emails
4. **Successful Login** → Redirect to internal dashboard
5. **Failed Login** → Error message with contact form link

## 🎨 Dashboard Design (iOS/iCloud Style)

### **Layout Inspiration**
- **Grid-based app icons** (similar to iOS Find My or iCloud)
- **Clean, minimal design** matching TGM Ventures aesthetic
- **Responsive grid** that adapts to screen size
- **Hover effects** and smooth animations
- **Professional color scheme** (black/white/blue accents)

### **App Grid Structure**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│    Gmail    │   Drive     │ Rent Manager│   Asana     │
│    📧       │     📁      │     🏠      │     ✅      │
└─────────────┴─────────────┴─────────────┴─────────────┘
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  [Future]   │  [Future]   │  [Future]   │  [Future]   │
│     📊      │     📈      │     🔧      │     📱      │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

## 📱 Core Applications (Phase 3.1)

### **Email** 📧
- **Name**: "Gmail"
- **URL**: `https://gmail.com`
- **Description**: "Company email and communications"
- **Icon**: Gmail-style envelope icon
- **Target**: New tab

### **Drive** 📁
- **Name**: "Google Drive"  
- **URL**: `https://drive.google.com`
- **Description**: "File storage and collaboration"
- **Icon**: Drive folder icon
- **Target**: New tab

### **Rent Manager** 🏠
- **Name**: "Rent Manager"
- **URL**: `[Your dedicated Rent Manager URL]`
- **Description**: "Property management system"
- **Icon**: House/building icon
- **Target**: New tab

### **Asana** ✅
- **Name**: "Project Management"
- **URL**: `https://app.asana.com/0/[your-workspace-id]`
- **Description**: "Task and project management"
- **Icon**: Checkmark/task icon
- **Target**: New tab

## 🛠️ Technical Implementation

### **Frontend Components**
```
/src/dashboard/
├── dashboard.html          # Main dashboard page
├── css/
│   ├── dashboard.css      # Dashboard-specific styles
│   └── app-grid.css       # App grid styling
├── js/
│   ├── auth.js           # Authentication handling
│   ├── dashboard.js      # Dashboard functionality
│   └── app-launcher.js   # App launching logic
└── components/
    ├── app-card.js       # Individual app card component
    └── user-menu.js      # User profile dropdown
```

### **Backend Features**
```
/functions/
├── auth.js               # Authentication middleware
├── user-management.js    # User role management
└── app-config.js        # Dynamic app configuration
```

### **Firebase Features**
- **Authentication**: Google OAuth with domain restriction
- **Firestore**: User preferences and app configurations
- **Security Rules**: Restrict access to @tgmventures.com users
- **Custom Claims**: Role-based access (admin, manager, user)

## 🔒 Security Requirements

### **Domain Restriction**
```javascript
// Only allow @tgmventures.com emails
const allowedDomain = 'tgmventures.com';
const userEmail = user.email;
const emailDomain = userEmail.split('@')[1];

if (emailDomain !== allowedDomain) {
  throw new Error('Access restricted to TGM Ventures team members');
}
```

### **Role-Based Access**
- **Admin**: Can add/remove apps, manage users
- **Manager**: Can access all apps, view analytics
- **User**: Can access assigned apps only

### **Session Security**
- **Automatic logout** after inactivity
- **Secure token refresh**
- **Device tracking** for security monitoring

## 📊 User Experience Flow

### **Public User (Not Logged In)**
1. **Homepage** → Clean, simple TGM Ventures site (unchanged)
2. **Contact Form** → Professional contact experience
3. **Legal Pages** → Privacy policy, terms of service

### **Team Member (Logged In)**
1. **Homepage** → Shows "Welcome back, [Name]" with dashboard link
2. **Dashboard Access** → Full app grid with company tools
3. **Quick Access** → One-click access to all company systems
4. **Profile Menu** → Logout, preferences, account settings

## 🎨 Design Specifications

### **App Cards**
- **Size**: 120x120px icons with labels
- **Spacing**: 20px between cards
- **Hover Effect**: Slight scale (1.05x) with shadow
- **Click Animation**: Brief scale down (0.95x) then launch
- **Typography**: Poppins font family (consistent with site)

### **Color Scheme**
- **Background**: Light gray (#f8f9fa)
- **Cards**: White with subtle border
- **Hover**: Light blue accent (#007bff)
- **Icons**: Colorful (matching each service's brand)
- **Text**: Dark gray (#333)

### **Responsive Breakpoints**
- **Desktop**: 4 columns
- **Tablet**: 3 columns  
- **Mobile**: 2 columns
- **Small Mobile**: 1 column

## 🚀 Implementation Phases

### **Phase 3.1: Core Dashboard (Week 1)**
- [ ] Google OAuth authentication
- [ ] Domain restriction (@tgmventures.com only)
- [ ] Basic dashboard layout
- [ ] 4 core apps (Gmail, Drive, Rent Manager, Asana)

### **Phase 3.2: Enhanced Features (Week 2)**
- [ ] User role management
- [ ] App configuration system
- [ ] Usage analytics
- [ ] Admin panel for app management

### **Phase 3.3: Advanced Features (Week 3)**
- [ ] Single Sign-On (SSO) integration
- [ ] Custom app shortcuts
- [ ] Team directory
- [ ] Notification system

## 📈 Future Expansion

### **Potential Additional Apps**
- **QuickBooks** (Accounting)
- **Slack** (Team Communication)
- **DocuSign** (Document Signing)
- **Calendly** (Scheduling)
- **Analytics Dashboard** (Custom reporting)
- **CRM System** (Customer management)
- **Project Portfolios** (RefiHub, future projects)

### **Advanced Features**
- **App Usage Analytics** → Track which tools are used most
- **Custom Shortcuts** → Personalized quick actions
- **Team Announcements** → Internal communication
- **Document Library** → Shared company resources
- **Training Materials** → Onboarding and procedures

## 🔧 Technical Requirements

### **Authentication**
- Firebase Authentication with Google provider
- Custom domain restriction middleware
- Role-based access control
- Secure session management

### **Database Schema**
```javascript
// Users Collection
{
  uid: "user-id",
  email: "user@tgmventures.com",
  name: "User Name",
  role: "admin|manager|user",
  preferences: {
    dashboardLayout: "grid|list",
    favoriteApps: ["gmail", "drive"],
    theme: "light|dark"
  },
  lastLogin: timestamp,
  createdAt: timestamp
}

// Apps Collection
{
  id: "gmail",
  name: "Gmail",
  description: "Company email",
  url: "https://gmail.com",
  icon: "gmail-icon.svg",
  category: "communication",
  requiredRole: "user",
  enabled: true,
  order: 1
}
```

### **Security Rules**
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow @tgmventures.com users
    match /{document=**} {
      allow read, write: if request.auth != null 
        && request.auth.token.email.matches('.*@tgmventures\\.com$');
    }
  }
}
```

## 🎯 Success Metrics

### **User Experience**
- **Login Success Rate**: >95%
- **App Launch Time**: <2 seconds
- **User Satisfaction**: Positive feedback from team
- **Daily Active Users**: Track team engagement

### **Technical Performance**
- **Page Load Time**: <3 seconds
- **Authentication Speed**: <5 seconds
- **Uptime**: 99.9%
- **Security**: Zero unauthorized access attempts

---

**This dashboard will transform TGM Ventures into a modern, efficient organization with centralized access to all company tools while maintaining the professional, simple aesthetic of the public website.**
