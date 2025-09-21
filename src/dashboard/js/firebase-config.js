// Firebase Configuration for TGM Ventures Dashboard
// Using CDN approach to match existing contact form pattern
// SECURITY: API keys are now loaded from external config file

// Check if config is loaded
if (!window.TGMConfig || !window.TGMConfig.firebase) {
    console.error('TGM Config not loaded! Please ensure config.js is included before this file.');
    throw new Error('Firebase configuration not available');
}

const firebaseConfig = window.TGMConfig.firebase;

// Initialize Firebase (will be called after CDN scripts load)
let auth, provider;

function initializeFirebaseAuth() {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    provider = new firebase.auth.GoogleAuthProvider();
    
    // Restrict to @tgmventures.com domain
    provider.setCustomParameters({
        'hd': 'tgmventures.com'
    });
    
    console.log('Firebase Auth initialized for TGM Ventures dashboard');
}

// Export for use in other files
window.TGMAuth = {
    init: initializeFirebaseAuth,
    getAuth: () => auth,
    getProvider: () => provider
};
