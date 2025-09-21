'use client'

import { useState } from 'react'
import LegalPageLayout from '@/components/ui/LegalPageLayout'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contactReason: '',
    company: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      // Simulate form submission for now
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSubmitStatus('success')
      setFormData({ name: '', email: '', phone: '', contactReason: '', company: '', message: '' })
    } catch (error) {
      console.error('Contact form error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <LegalPageLayout title="Contact Us">
      <div>
        <p style={{
          fontSize: '18px',
          color: '#666',
          marginBottom: '40px',
          textAlign: 'center',
          fontFamily: 'Poppins, sans-serif'
        }}>
          Get in touch with TGM Ventures for business inquiries, property management, or general questions.
        </p>

        {/* Success Message */}
        {submitStatus === 'success' && (
          <div style={{
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{
              color: '#155724',
              margin: 0,
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '500'
            }}>
              ✅ Thank you! Your message has been sent successfully. We&apos;ll get back to you soon.
            </p>
          </div>
        )}

        {/* Error Message */}
        {submitStatus === 'error' && (
          <div style={{
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{
              color: '#721c24',
              margin: 0,
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '500'
            }}>
              ❌ Sorry, there was an error. Please try again or contact us directly.
            </p>
          </div>
        )}

        {/* Contact Form */}
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #ddd',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          fontFamily: 'Poppins, sans-serif'
        }}>
          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div style={{ marginBottom: '25px' }}>
              <label 
                htmlFor="name"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '8px',
                  fontFamily: 'Poppins, sans-serif'
                }}
              >
                Full Name <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontFamily: 'Poppins, sans-serif',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => { 
                  e.currentTarget.style.borderColor = '#007bff'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)'
                }}
                onBlur={(e) => { 
                  e.currentTarget.style.borderColor = '#e1e5e9'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Email Address */}
            <div style={{ marginBottom: '25px' }}>
              <label 
                htmlFor="email"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '8px',
                  fontFamily: 'Poppins, sans-serif'
                }}
              >
                Email Address <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontFamily: 'Poppins, sans-serif',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => { 
                  e.currentTarget.style.borderColor = '#007bff'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)'
                }}
                onBlur={(e) => { 
                  e.currentTarget.style.borderColor = '#e1e5e9'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Phone Number */}
            <div style={{ marginBottom: '25px' }}>
              <label 
                htmlFor="phone"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '8px',
                  fontFamily: 'Poppins, sans-serif'
                }}
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontFamily: 'Poppins, sans-serif',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => { 
                  e.currentTarget.style.borderColor = '#007bff'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)'
                }}
                onBlur={(e) => { 
                  e.currentTarget.style.borderColor = '#e1e5e9'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Contact Reason */}
            <div style={{ marginBottom: '25px' }}>
              <label 
                htmlFor="contactReason"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '8px',
                  fontFamily: 'Poppins, sans-serif'
                }}
              >
                Contact Reason <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <select
                id="contactReason"
                name="contactReason"
                value={formData.contactReason}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontFamily: 'Poppins, sans-serif',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  outline: 'none',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => { 
                  e.currentTarget.style.borderColor = '#007bff'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)'
                }}
                onBlur={(e) => { 
                  e.currentTarget.style.borderColor = '#e1e5e9'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <option value="">Please select...</option>
                <option value="general">General Inquiry</option>
                <option value="property-management">Property Management Inquiry</option>
                <option value="business-management">Business Management Services</option>
                <option value="investment-opportunity">Investment Opportunity</option>
                <option value="media-press">Media & Press</option>
              </select>
            </div>

            {/* Company/Organization */}
            <div style={{ marginBottom: '25px' }}>
              <label 
                htmlFor="company"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '8px',
                  fontFamily: 'Poppins, sans-serif'
                }}
              >
                Company/Organization
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontFamily: 'Poppins, sans-serif',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => { 
                  e.currentTarget.style.borderColor = '#007bff'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)'
                }}
                onBlur={(e) => { 
                  e.currentTarget.style.borderColor = '#e1e5e9'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Message */}
            <div style={{ marginBottom: '25px' }}>
              <label 
                htmlFor="message"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '8px',
                  fontFamily: 'Poppins, sans-serif'
                }}
              >
                Message <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Please provide details about your inquiry..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontFamily: 'Poppins, sans-serif',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '120px',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => { 
                  e.currentTarget.style.borderColor = '#007bff'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)'
                }}
                onBlur={(e) => { 
                  e.currentTarget.style.borderColor = '#e1e5e9'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* reCAPTCHA Notice */}
            <div style={{
              margin: '25px 0',
              textAlign: 'center',
              fontSize: '12px',
              color: '#666',
              fontFamily: 'Poppins, sans-serif'
            }}>
              This site is protected by reCAPTCHA Enterprise and the Google{' '}
              <a 
                href="https://policies.google.com/privacy" 
                target="_blank"
                style={{
                  color: '#0066cc',
                  textDecoration: 'none',
                  fontFamily: 'Poppins, sans-serif'
                }}
              >
                Privacy Policy
              </a> and{' '}
              <a 
                href="https://policies.google.com/terms" 
                target="_blank"
                style={{
                  color: '#0066cc',
                  textDecoration: 'none',
                  fontFamily: 'Poppins, sans-serif'
                }}
              >
                Terms of Service
              </a> apply.
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                backgroundColor: isSubmitting ? '#6c757d' : '#28a745',
                color: 'white',
                padding: '15px 20px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: '600',
                fontFamily: 'Poppins, sans-serif',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s ease, transform 0.2s ease',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#218838'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#28a745'
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </LegalPageLayout>
  )
}