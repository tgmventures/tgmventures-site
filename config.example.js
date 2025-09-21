// Configuration Template for TGM Ventures
// Copy this file to config.js and fill in your actual values
// NEVER commit the actual config.js file to git

const config = {
    firebase: {
        apiKey: "your_firebase_api_key_here",
        authDomain: "tgm-ventures-site.firebaseapp.com",
        projectId: "tgm-ventures-site",
        storageBucket: "tgm-ventures-site.firebasestorage.app",
        messagingSenderId: "411860917330",
        appId: "1:411860917330:web:15501bfa6d8b6ff892138b",
        measurementId: "G-V6Q536QH5Z"
    },
    sendgrid: {
        apiKey: "your_sendgrid_api_key_here"
    },
    recaptcha: {
        siteKey: "your_recaptcha_site_key_here",
        secretKey: "your_recaptcha_secret_key_here"
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
} else {
    window.TGMConfig = config;
}
