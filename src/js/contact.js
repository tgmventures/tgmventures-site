// Contact Form Functionality - Simplified for Testing
class ContactForm {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.init();
    }

    init() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        console.log('Contact form initialized');
    }

    validateForm() {
        const formData = new FormData(this.form);
        const errors = [];

        // Required field validation
        const requiredFields = ['name', 'email', 'contactReason', 'message'];
        requiredFields.forEach(field => {
            if (!formData.get(field) || formData.get(field).trim() === '') {
                errors.push(`${this.getFieldLabel(field)} is required.`);
            }
        });

        // Email validation
        const email = formData.get('email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            errors.push('Please enter a valid email address.');
        }

        return errors;
    }

    getFieldLabel(fieldName) {
        const labels = {
            'name': 'Name',
            'email': 'Email',
            'contactReason': 'Contact Reason',
            'message': 'Message'
        };
        return labels[fieldName] || fieldName;
    }

    showMessage(message, isError = false) {
        const successEl = document.getElementById('successMessage');
        const errorEl = document.getElementById('errorMessage');
        
        // Hide both messages first
        successEl.style.display = 'none';
        errorEl.style.display = 'none';
        
        if (isError) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        } else {
            successEl.textContent = message;
            successEl.style.display = 'block';
        }
        
        // Scroll to message
        const messageEl = isError ? errorEl : successEl;
        messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    async handleSubmit(e) {
        e.preventDefault();
        console.log('=== FORM SUBMISSION START ===');
        
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.textContent;
        
        // Validate form
        const errors = this.validateForm();
        if (errors.length > 0) {
            console.log('Validation errors:', errors);
            this.showMessage(errors.join(' '), true);
            return;
        }
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        try {
            await this.submitForm();
            console.log('Form submission successful');
            this.showMessage('Thank you for your message! We\'ll get back to you soon.');
            this.form.reset();
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showMessage(`Error: ${error.message}`, true);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    async submitForm() {
        console.log('=== SUBMIT FORM START ===');
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData);
        console.log('Form data collected:', data);
        
        // Get reCAPTCHA Enterprise token (optimized for speed)
        try {
            const token = await grecaptcha.enterprise.execute('6LfMddArAAAAAJCNFWRRz0lW5FlD7BJTvR5UIX9W', {action: 'CONTACT_FORM'});
            data.recaptchaResponse = token;
        } catch (error) {
            console.error('reCAPTCHA generation failed:', error);
            data.recaptchaResponse = 'fallback-token';
        }
        
        console.log('Sending to backend:', JSON.stringify(data, null, 2));
        
        const response = await fetch('https://us-central1-tgm-ventures-site.cloudfunctions.net/submitContactForm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        console.log('Response received - Status:', response.status);
        console.log('Response OK:', response.ok);
        
        if (!response.ok) {
            let errorText;
            try {
                const errorData = await response.json();
                errorText = errorData.error || `HTTP ${response.status}`;
                console.error('Backend error:', errorData);
            } catch (parseError) {
                errorText = `HTTP ${response.status}: ${response.statusText}`;
                console.error('Could not parse error response:', parseError);
            }
            throw new Error(errorText);
        }
        
        const result = await response.json();
        console.log('Backend success:', result);
        return result;
    }
}

// Initialize form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing contact form');
    new ContactForm();
});