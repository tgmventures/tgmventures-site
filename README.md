# TGM Ventures Website

A professional management company website for TGM Ventures, Inc., a Washington state corporation specializing in building, buying, and managing businesses and real estate.

## 🚨 CRITICAL PRESERVATION RULES

### Core Pages - DO NOT MODIFY WITHOUT EXPLICIT PERMISSION
The following pages must remain **EXACTLY** as they are and maintain their simple, elegant design:

- **Homepage (`index.html`)** - Simple black background with warehouse image, TGM logo, and tagline
- **Privacy Policy (`privacy-policy.html`)** - Comprehensive legal document 
- **Terms of Service (`terms-of-service.html`)** - Comprehensive legal document

**⚠️ IMPORTANT**: These pages are intentionally minimal and professional. Any changes to their design, content, or functionality require explicit user approval before implementation.

### Legacy Projects - GRANDFATHERED & PROTECTED
The following files and directories are legacy projects that must NOT be touched or modified:

```
/refihub/                    # Complete RefiHub project directory
/refihub-deal-analyzer.html  # Legacy RefiHub files in root
/refihub-game.html
/refihub-loan-request.html
/stock-game.html
```

These files are grandfathered into the V2 structure and should be preserved exactly as-is.

## Project Structure

### V2 Architecture (Current)
```
/
├── src/                     # Modern web app source code
├── public/                  # Static assets and build output
├── projects/               # Legacy projects (organized)
│   ├── refihub/           # Moved from root /refihub/
│   └── legacy-games/      # Other legacy HTML games
├── README.md              # This file
├── .cursorrules          # AI development guidelines
└── package.json          # Dependencies and scripts
```

### Core Pages
- **Homepage**: Clean, minimal design with TGM branding
- **Privacy Policy**: Legal compliance document
- **Terms of Service**: Legal compliance document  
- **Contact**: New dynamic contact form (V2 addition)

## Development Guidelines

### What CAN be modified:
- Project organization and file structure
- Adding new dynamic functionality
- Creating new pages (like contact forms)
- Improving build processes and tooling
- Adding modern web app capabilities

### What CANNOT be modified without permission:
- Visual design of core pages (homepage, privacy, terms)
- Content of legal documents
- User experience of existing pages
- Legacy project files

## Technology Stack

### V1 (Legacy)
- Pure HTML/CSS/JavaScript
- Poppins font family
- Simple, static design

### V2 (Current)
- Modern web application framework
- Dynamic form handling
- Email integration with CAPTCHA
- Scalable architecture for future MVPs

## Contact Form Requirements

The new contact form must include:
- ✅ Multiple contact reason options
- ✅ CAPTCHA spam protection  
- ✅ Email submission (no direct email exposure)
- ✅ Professional styling consistent with brand
- ✅ Mobile responsive design

## Future Development

This structure supports:
- Adding new product MVPs in `/projects/` directory
- Dynamic functionality and user interactions
- Scalable web application features
- Integration with external services

## AI Development Instructions

When working on this project:

1. **ALWAYS** check this README before making changes
2. **NEVER** modify core pages without explicit permission
3. **PRESERVE** the simple, professional aesthetic
4. **ORGANIZE** new projects in the `/projects/` directory
5. **MAINTAIN** visual consistency with existing brand
6. **TEST** thoroughly before deployment

---

*This project represents the digital presence of TGM Ventures, Inc. Maintain professionalism and simplicity in all modifications.*

