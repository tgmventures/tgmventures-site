# Technical Specifications - TGM Ventures Dashboard

## 🔐 **Authentication Implementation**

### **Google OAuth Setup**
```javascript
// Firebase Auth Configuration
const firebaseConfig = {
  // ... existing config
  authDomain: "tgm-ventures-site.firebaseapp.com"
};

// Google OAuth Provider with domain restriction
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  'hd': 'tgmventures.com' // Restrict to TGM Ventures domain
});
```

### **Domain Validation Function**
```javascript
async function validateTGMUser(user) {
  const email = user.email;
  const domain = email.split('@')[1];
  
  if (domain !== 'tgmventures.com') {
    await auth.signOut();
    throw new Error('Access restricted to TGM Ventures team members only');
  }
  
  // Set custom claims
  await setCustomUserClaims(user.uid, {
    tgmEmployee: true,
    domain: 'tgmventures.com'
  });
}
```

## 🎨 **Dashboard UI Components**

### **App Card Component**
```html
<div class="app-card" data-app="gmail">
  <div class="app-icon">
    <img src="/icons/gmail.svg" alt="Gmail">
  </div>
  <div class="app-name">Gmail</div>
  <div class="app-description">Company Email</div>
</div>
```

### **App Card Styling**
```css
.app-card {
  width: 140px;
  height: 140px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 10px;
}

.app-card:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.app-card:active {
  transform: scale(0.95);
}

.app-icon img {
  width: 48px;
  height: 48px;
  margin-bottom: 8px;
}

.app-name {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.app-description {
  font-size: 12px;
  color: #666;
  text-align: center;
}
```

## 📱 **App Configuration System**

### **App Registry**
```javascript
const COMPANY_APPS = {
  gmail: {
    name: 'Gmail',
    description: 'Company Email',
    url: 'https://gmail.com',
    icon: '/icons/gmail.svg',
    category: 'communication',
    requiredRole: 'user',
    newTab: true
  },
  drive: {
    name: 'Google Drive',
    description: 'File Storage',
    url: 'https://drive.google.com',
    icon: '/icons/drive.svg',
    category: 'productivity',
    requiredRole: 'user',
    newTab: true
  },
  rentmanager: {
    name: 'Rent Manager',
    description: 'Property Management',
    url: 'https://[your-rent-manager-url]',
    icon: '/icons/building.svg',
    category: 'business',
    requiredRole: 'user',
    newTab: true
  },
  asana: {
    name: 'Asana',
    description: 'Project Management',
    url: 'https://app.asana.com/0/[workspace-id]',
    icon: '/icons/asana.svg',
    category: 'productivity',
    requiredRole: 'user',
    newTab: true
  }
};
```

### **App Launcher Logic**
```javascript
function launchApp(appId) {
  const app = COMPANY_APPS[appId];
  if (!app) return;
  
  // Track usage
  trackAppUsage(appId);
  
  // Launch app
  if (app.newTab) {
    window.open(app.url, '_blank', 'noopener,noreferrer');
  } else {
    window.location.href = app.url;
  }
}

async function trackAppUsage(appId) {
  const user = auth.currentUser;
  if (!user) return;
  
  await firestore.collection('appUsage').add({
    userId: user.uid,
    appId: appId,
    timestamp: new Date(),
    userAgent: navigator.userAgent
  });
}
```

## 🔒 **Security Implementation**

### **Firebase Security Rules**
```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles (own data only)
    match /users/{userId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId
        && request.auth.token.email.matches('.*@tgmventures\\.com$');
    }
    
    // App configurations (read-only for users)
    match /apps/{appId} {
      allow read: if request.auth != null 
        && request.auth.token.email.matches('.*@tgmventures\\.com$');
      allow write: if request.auth != null 
        && request.auth.token.email.matches('.*@tgmventures\\.com$')
        && request.auth.token.role == 'admin';
    }
    
    // Usage analytics (own data only)
    match /appUsage/{usageId} {
      allow create: if request.auth != null 
        && request.auth.token.email.matches('.*@tgmventures\\.com$')
        && request.auth.uid == resource.data.userId;
      allow read: if request.auth != null 
        && request.auth.token.email.matches('.*@tgmventures\\.com$')
        && (request.auth.uid == resource.data.userId 
            || request.auth.token.role == 'admin');
    }
  }
}
```

### **Authentication Middleware**
```javascript
// Firebase Function for user validation
exports.validateTGMUser = functions.auth.user().onCreate(async (user) => {
  const email = user.email;
  const domain = email.split('@')[1];
  
  if (domain !== 'tgmventures.com') {
    // Delete unauthorized user
    await admin.auth().deleteUser(user.uid);
    throw new Error('Unauthorized domain');
  }
  
  // Set custom claims
  await admin.auth().setCustomUserClaims(user.uid, {
    tgmEmployee: true,
    role: 'user', // Default role
    domain: 'tgmventures.com'
  });
  
  // Create user profile
  await admin.firestore().collection('users').doc(user.uid).set({
    email: user.email,
    name: user.displayName,
    role: 'user',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastLogin: admin.firestore.FieldValue.serverTimestamp()
  });
});
```

## 📊 **Database Schema**

### **Users Collection**
```javascript
/users/{userId} {
  email: "user@tgmventures.com",
  name: "User Name",
  role: "admin" | "manager" | "user",
  department: "management" | "operations" | "finance",
  preferences: {
    dashboardLayout: "grid" | "list",
    favoriteApps: ["gmail", "drive", "asana"],
    theme: "light" | "dark",
    appOrder: ["gmail", "drive", "rentmanager", "asana"]
  },
  lastLogin: timestamp,
  createdAt: timestamp,
  isActive: boolean
}
```

### **Apps Collection**
```javascript
/apps/{appId} {
  id: "gmail",
  name: "Gmail",
  description: "Company email and communications",
  url: "https://gmail.com",
  icon: "/icons/gmail.svg",
  category: "communication",
  requiredRole: "user",
  enabled: true,
  order: 1,
  newTab: true,
  ssoEnabled: false,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### **App Usage Analytics**
```javascript
/appUsage/{usageId} {
  userId: "user-id",
  appId: "gmail",
  timestamp: timestamp,
  userAgent: "browser info",
  sessionId: "session-id"
}
```

## 🚀 **Development Workflow**

### **File Structure Addition**
```
/src/dashboard/
├── dashboard.html          # Main dashboard page
├── login.html             # Login page
├── css/
│   ├── dashboard.css      # Dashboard-specific styles
│   ├── auth.css          # Authentication styles
│   └── components.css    # Reusable component styles
├── js/
│   ├── auth.js           # Authentication handling
│   ├── dashboard.js      # Dashboard functionality
│   ├── app-launcher.js   # App launching logic
│   └── analytics.js      # Usage tracking
├── icons/                # App icons (SVG format)
│   ├── gmail.svg
│   ├── drive.svg
│   ├── building.svg      # Rent Manager
│   └── asana.svg
└── components/
    ├── app-card.html     # App card template
    ├── user-menu.html    # User profile dropdown
    └── admin-panel.html  # Admin management interface
```

### **Build Process Updates**
```javascript
// Updated build.js
const dashboardFiles = [
  'src/dashboard/dashboard.html',
  'src/dashboard/login.html',
  'src/dashboard/css/*.css',
  'src/dashboard/js/*.js',
  'src/dashboard/icons/*.svg'
];

// Copy dashboard files to public/dashboard/
dashboardFiles.forEach(file => {
  // Copy to public directory
});
```

## 🔧 **Firebase Configuration Updates**

### **Authentication Providers**
```json
// Firebase Console → Authentication → Sign-in method
{
  "providers": [
    {
      "providerId": "google.com",
      "enabled": true,
      "configuration": {
        "hostedDomain": "tgmventures.com"
      }
    }
  ]
}
```

### **Firestore Indexes**
```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "appUsage",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "timestamp", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "apps",
      "queryScope": "COLLECTION", 
      "fields": [
        {"fieldPath": "enabled", "order": "ASCENDING"},
        {"fieldPath": "order", "order": "ASCENDING"}
      ]
    }
  ]
}
```

## 📈 **Performance Considerations**

### **Optimization Strategies**
- **Lazy Loading** → Load dashboard only after authentication
- **Icon Optimization** → SVG icons for crisp display at any size
- **Caching** → Cache app configurations in localStorage
- **Preloading** → Preload frequently used app icons
- **Analytics** → Track performance metrics

### **Security Considerations**
- **Token Validation** → Verify tokens on every sensitive operation
- **Session Timeout** → Automatic logout after inactivity
- **Audit Logging** → Track all authentication events
- **Rate Limiting** → Prevent abuse of authentication endpoints

---

**This technical specification provides a complete blueprint for implementing the TGM Ventures internal dashboard while maintaining the security, performance, and aesthetic standards of the current website.**
