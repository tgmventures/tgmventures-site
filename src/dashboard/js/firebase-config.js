// Firebase Configuration for TGM Ventures Dashboard
// Using CDN approach to match existing contact form pattern

const firebaseConfig = {
    apiKey: "AIzaSyAffXsVM8HjEVlDc8kX9Wzkv9muD_zFWGA",
    authDomain: "tgm-ventures-site.firebaseapp.com",
    projectId: "tgm-ventures-site",
    storageBucket: "tgm-ventures-site.firebasestorage.app",
    messagingSenderId: "411860917330",
    appId: "1:411860917330:web:15501bfa6d8b6ff892138b",
    measurementId: "G-V6Q536QH5Z"
};

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
