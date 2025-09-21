// TGM Ventures Dashboard Authentication
// Following the same high-quality vanilla JS pattern as contact form

class TGMAuth {
    constructor() {
        this.auth = null;
        this.provider = null;
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Wait for Firebase to be available
        if (typeof firebase === 'undefined') {
            console.error('Firebase not loaded. Make sure Firebase CDN scripts are included.');
            return;
        }

        // Initialize Firebase Auth
        window.TGMAuth.init();
        this.auth = window.TGMAuth.getAuth();
        this.provider = window.TGMAuth.getProvider();

        // Set up auth state listener
        this.auth.onAuthStateChanged((user) => {
            this.handleAuthStateChange(user);
        });

        console.log('TGM Dashboard Auth initialized');
    }

    handleAuthStateChange(user) {
        this.currentUser = user;
        
        if (user) {
            console.log('User signed in:', user.email);
            
            // Verify domain restriction
            if (!user.email.endsWith('@tgmventures.com')) {
                console.error('Unauthorized domain:', user.email);
                this.signOut();
                this.showError('Access restricted to @tgmventures.com email addresses only.');
                return;
            }
            
            // Redirect to dashboard if on login page
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'dashboard.html';
            }
            
            // Update UI for authenticated state
            this.updateUIForAuthenticatedUser(user);
            
        } else {
            console.log('User signed out');
            
            // Redirect to login if on dashboard page
            if (window.location.pathname.includes('dashboard.html')) {
                window.location.href = 'login.html';
            }
            
            // Update UI for unauthenticated state
            this.updateUIForUnauthenticatedUser();
        }
    }

    async signInWithGoogle() {
        try {
            console.log('Attempting Google sign-in...');
            
            const result = await this.auth.signInWithPopup(this.provider);
            const user = result.user;
            
            console.log('Google sign-in successful:', user.email);
            return user;
            
        } catch (error) {
            console.error('Google sign-in error:', error);
            
            // Handle specific error cases
            if (error.code === 'auth/popup-closed-by-user') {
                this.showError('Sign-in cancelled. Please try again.');
            } else if (error.code === 'auth/popup-blocked') {
                this.showError('Pop-up blocked. Please allow pop-ups for this site and try again.');
            } else {
                this.showError(`Sign-in failed: ${error.message}`);
            }
            
            throw error;
        }
    }

    async signOut() {
        try {
            await this.auth.signOut();
            console.log('User signed out successfully');
        } catch (error) {
            console.error('Sign-out error:', error);
            this.showError('Failed to sign out. Please try again.');
        }
    }

    updateUIForAuthenticatedUser(user) {
        // Update user info display
        const userEmailEl = document.getElementById('userEmail');
        const userNameEl = document.getElementById('userName');
        const signOutBtn = document.getElementById('signOutBtn');
        
        if (userEmailEl) userEmailEl.textContent = user.email;
        if (userNameEl) userNameEl.textContent = user.displayName || user.email.split('@')[0];
        if (signOutBtn) {
            signOutBtn.style.display = 'block';
            signOutBtn.onclick = () => this.signOut();
        }

        // Show authenticated content
        const authContent = document.getElementById('authenticatedContent');
        const unauthContent = document.getElementById('unauthenticatedContent');
        
        if (authContent) authContent.style.display = 'block';
        if (unauthContent) unauthContent.style.display = 'none';
    }

    updateUIForUnauthenticatedUser() {
        // Hide authenticated content
        const authContent = document.getElementById('authenticatedContent');
        const unauthContent = document.getElementById('unauthenticatedContent');
        const signOutBtn = document.getElementById('signOutBtn');
        
        if (authContent) authContent.style.display = 'none';
        if (unauthContent) unauthContent.style.display = 'block';
        if (signOutBtn) signOutBtn.style.display = 'none';
    }

    showError(message) {
        const errorEl = document.getElementById('errorMessage');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorEl.style.display = 'none';
            }, 5000);
        } else {
            // Fallback to alert if no error element
            alert(message);
        }
    }

    // Utility method to check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Get current user info
    getCurrentUser() {
        return this.currentUser;
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing TGM Dashboard Auth');
    window.tgmAuth = new TGMAuth();
});

// Set up global sign-in handler for login button
window.handleGoogleSignIn = async () => {
    if (window.tgmAuth) {
        const signInBtn = document.getElementById('googleSignInBtn');
        if (signInBtn) {
            signInBtn.disabled = true;
            signInBtn.textContent = 'Signing in...';
        }
        
        try {
            await window.tgmAuth.signInWithGoogle();
        } finally {
            if (signInBtn) {
                signInBtn.disabled = false;
                signInBtn.textContent = 'Sign in with Google';
            }
        }
    }
};
