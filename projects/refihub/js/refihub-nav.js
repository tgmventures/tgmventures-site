class RefiHubNav extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        
        // Get current page to highlight active nav item
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        const styles = `
            :host {
                all: initial; /* Reset all inherited styles */

                /* Re-apply necessary host styles */
                display: block;
                position: relative;
                height: var(--rh-nav-height);
                font-family: 'Inter', sans-serif; /* Re-apply font */

                /* Define nav variables directly within the component */
                --rh-nav-height: 64px; 
                --rh-nav-bg: #ffffff; /* White background */
                --rh-nav-border: #e2e8f0; /* Light border (from shared) */
                --rh-nav-text: #1e293b; /* Dark text (from shared) */
                --rh-nav-hover: #2563eb; /* Primary blue (from shared) */
                --rh-nav-active: #1d4ed8; /* Primary dark blue (from shared) */
                --rh-nav-bg-transparent: rgba(255, 255, 255, 0.95); /* High-opacity white for blur */
                
                /* Base color needed for currentColor SVG inheritance */
                color: var(--rh-nav-text);
            }

            nav {
                height: var(--rh-nav-height);
                background: var(--rh-nav-bg); /* Changed from transparent to solid white */
                /* backdrop-filter: blur(8px); Removed blur effect */
                border-bottom: 1px solid var(--rh-nav-border);
                display: flex;
                align-items: center;
                padding: 0 2rem;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 1000;
            }

            .nav-container {
                max-width: 1200px;
                margin: 0 auto;
                width: 100%;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .nav-brand {
                font-size: 24px; /* Changed from 1.5rem */
                font-weight: bold;
                color: var(--rh-nav-text);
                text-decoration: none;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .nav-brand:hover {
                color: var(--rh-nav-hover);
            }

            /* Add style for visited brand links */
            .nav-brand:visited {
                color: var(--rh-nav-text);
            }

            .nav-links {
                display: flex;
                gap: 2rem;
                align-items: center;
            }

            .nav-link {
                color: var(--rh-nav-text);
                text-decoration: none;
                font-weight: 500;
                font-size: 16px; /* Added explicit font size */
                padding: 0.5rem 1rem;
                border-radius: 0.5rem;
                transition: all 0.2s ease;
            }

            .nav-link:hover {
                color: var(--rh-nav-hover);
                background: rgba(37, 99, 235, 0.07); /* Lighter hover background */
            }

            /* Add style for visited links to prevent browser default */
            .nav-link:visited {
                color: var(--rh-nav-text); /* Keep text color the same as default */
            }

            .nav-link.active {
                color: var(--rh-nav-active);
                background: rgba(29, 78, 216, 0.09); /* Lighter active background */
                font-weight: 600; /* Make active link bolder */
            }

            @media (max-width: 768px) {
                nav {
                    padding: 0 1rem;
                }

                .nav-links {
                    gap: 1rem;
                }

                .nav-link {
                    padding: 0.5rem;
                    font-size: 14px; /* Changed from 0.9rem */
                }
            }
        `;

        const html = `
            <nav>
                <div class="nav-container">
                    <a href="index.html" class="nav-brand">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        RefiHub
                    </a>
                    <div class="nav-links">
                        <a href="index.html" class="nav-link ${currentPage === 'index.html' ? 'active' : ''}">Home</a>
                        <a href="refihub-loan-request.html" class="nav-link ${currentPage === 'refihub-loan-request.html' ? 'active' : ''}">Request Loan</a>
                        <a href="refihub-deal-analyzer.html" class="nav-link ${currentPage === 'refihub-deal-analyzer.html' ? 'active' : ''}">Analyze Deal</a>
                        <a href="refihub-game.html" class="nav-link ${currentPage === 'refihub-game.html' ? 'active' : ''}">Hub</a>
                    </div>
                </div>
            </nav>
        `;

        shadow.innerHTML = `
            <style>${styles}</style>
            ${html}
        `;
    }
}

customElements.define('refihub-nav', RefiHubNav); 