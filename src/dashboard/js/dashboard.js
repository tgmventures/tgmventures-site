// TGM Ventures Dashboard Functionality
// Additional dashboard-specific features

class TGMDashboard {
    constructor() {
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.warningTimeout = 25 * 60 * 1000; // 25 minutes (5 min warning)
        this.timeoutWarningShown = false;
        this.init();
    }

    init() {
        console.log('TGM Dashboard initialized');
        this.setupSessionTimeout();
        this.setupAppCardAnalytics();
        this.setupKeyboardShortcuts();
    }

    setupSessionTimeout() {
        let timeoutId;
        let warningId;

        const resetTimeout = () => {
            clearTimeout(timeoutId);
            clearTimeout(warningId);
            this.timeoutWarningShown = false;
            this.hideSessionWarning();

            // Set warning timeout (5 minutes before logout)
            warningId = setTimeout(() => {
                this.showSessionWarning();
            }, this.warningTimeout);

            // Set logout timeout
            timeoutId = setTimeout(() => {
                this.handleSessionTimeout();
            }, this.sessionTimeout);
        };

        // Track user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            document.addEventListener(event, resetTimeout, true);
        });

        // Initialize timeout
        resetTimeout();
    }

    showSessionWarning() {
        if (this.timeoutWarningShown) return;
        this.timeoutWarningShown = true;

        const warningEl = document.createElement('div');
        warningEl.id = 'sessionWarning';
        warningEl.className = 'session-warning';
        warningEl.innerHTML = `
            <div class="warning-content">
                <h3>Session Expiring Soon</h3>
                <p>Your session will expire in 5 minutes due to inactivity.</p>
                <button onclick="window.tgmDashboard.extendSession()" class="extend-btn">Stay Logged In</button>
                <button onclick="window.tgmAuth.signOut()" class="logout-btn">Log Out Now</button>
            </div>
        `;

        document.body.appendChild(warningEl);
        console.log('Session timeout warning displayed');
    }

    hideSessionWarning() {
        const warningEl = document.getElementById('sessionWarning');
        if (warningEl) {
            warningEl.remove();
        }
    }

    extendSession() {
        this.hideSessionWarning();
        console.log('Session extended by user');
        // The resetTimeout will be triggered by the click event
    }

    handleSessionTimeout() {
        console.log('Session timed out - signing out user');
        if (window.tgmAuth) {
            window.tgmAuth.signOut();
        }
    }

    setupAppCardAnalytics() {
        // Track which apps are being used
        const appCards = document.querySelectorAll('.app-card');
        appCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const appName = card.querySelector('.app-name').textContent;
                console.log(`User clicked on ${appName} app`);
                
                // Could send analytics to Firebase or other service
                this.trackAppUsage(appName);
            });
        });
    }

    trackAppUsage(appName) {
        // Simple client-side tracking (could be enhanced with Firebase Analytics)
        const usage = JSON.parse(localStorage.getItem('tgm-app-usage') || '{}');
        const today = new Date().toISOString().split('T')[0];
        
        if (!usage[today]) usage[today] = {};
        usage[today][appName] = (usage[today][appName] || 0) + 1;
        
        // Keep only last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        Object.keys(usage).forEach(date => {
            if (new Date(date) < thirtyDaysAgo) {
                delete usage[date];
            }
        });
        
        localStorage.setItem('tgm-app-usage', JSON.stringify(usage));
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + 1-4 for quick app access
            if (e.altKey && e.key >= '1' && e.key <= '4') {
                e.preventDefault();
                const appIndex = parseInt(e.key) - 1;
                const appCards = document.querySelectorAll('.app-card');
                if (appCards[appIndex]) {
                    appCards[appIndex].click();
                }
            }
            
            // Ctrl/Cmd + L for logout
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                e.preventDefault();
                if (window.tgmAuth) {
                    window.tgmAuth.signOut();
                }
            }
        });
    }

    // Utility method to get app usage stats
    getAppUsageStats() {
        return JSON.parse(localStorage.getItem('tgm-app-usage') || '{}');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing TGM Dashboard');
    window.tgmDashboard = new TGMDashboard();
});
