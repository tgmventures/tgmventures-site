'use client'

import { useState } from 'react'
import LegalPageLayout from '@/components/ui/LegalPageLayout'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    reason: '',
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
      setFormData({ name: '', email: '', reason: '', message: '' })
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
        {/* Contact Form */}
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #ddd',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '600px',
          margin: '0 auto',
          fontFamily: 'Poppins, sans-serif'
        }}>
          <form onSubmit={handleSubmit}>
            {/* Name Field */}
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
                Name *
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
                placeholder="Your full name"
              />
            </div>

            {/* Email Field */}
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
                Email *
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
                placeholder="your.email@example.com"
              />
            </div>

            {/* Reason Field */}
            <div style={{ marginBottom: '25px' }}>
              <label 
                htmlFor="reason"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '8px',
                  fontFamily: 'Poppins, sans-serif'
                }}
              >
                Reason for Contact *
              </label>
              <select
                id="reason"
                name="reason"
                value={formData.reason}
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
                <option value="">Select a reason</option>
                <option value="business-opportunity">Business Opportunity</option>
                <option value="real-estate">Real Estate Inquiry</option>
                <option value="partnership">Partnership</option>
                <option value="investment">Investment Opportunity</option>
                <option value="general">General Inquiry</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Message Field */}
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
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
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
                placeholder="Please provide details about your inquiry..."
              />
            </div>

            {/* Submit Button */}
            <div style={{ marginBottom: '20px' }}>
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
            </div>

            {/* Status Messages */}
            {submitStatus === 'success' && (
              <div style={{
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '8px',
                padding: '15px',
                marginTop: '20px'
              }}>
                <p style={{
                  color: '#155724',
                  margin: 0,
                  textAlign: 'center',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: '500'
                }}>
                  ✅ Thank you! Your message has been sent successfully. We&apos;ll get back to you soon.
                </p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div style={{
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '8px',
                padding: '15px',
                marginTop: '20px'
              }}>
                <p style={{
                  color: '#721c24',
                  margin: 0,
                  textAlign: 'center',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: '500'
                }}>
                  ❌ Sorry, there was an error. Please try again or contact us directly.
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Contact Information */}
        <div style={{
          marginTop: '40px',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '20px',
            color: '#222',
            fontFamily: 'Poppins, sans-serif'
          }}>
            Other Ways to Reach Us
          </h2>
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '400px',
            margin: '0 auto',
            border: '1px solid #e9ecef'
          }}>
            <p style={{
              color: '#333',
              margin: 0,
              fontFamily: 'Poppins, sans-serif',
              lineHeight: '1.6',
              fontSize: '16px'
            }}>
              <strong>Email:</strong> management@tgmventures.com<br />
              <strong>Website:</strong> www.tgmventures.com
            </p>
          </div>
        </div>
      </div>
    </LegalPageLayout>
  )
}
