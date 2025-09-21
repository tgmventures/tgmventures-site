'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Footer from '@/components/ui/Footer'

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
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit form')
      }

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
    <div 
      className="min-h-screen flex flex-col"
      style={{
        margin: 0,
        padding: 0,
        backgroundColor: 'white',
        color: '#333',
        fontFamily: 'Poppins, sans-serif',
        lineHeight: 1.6,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header - Black background with logo */}
      <header 
        style={{
          backgroundColor: 'black',
          padding: '20px 0',
          textAlign: 'center'
        }}
      >
        <Link 
          href="/" 
          style={{ display: 'inline-block' }}
        >
          <Image
            src="https://github.com/tgmventures/tgmventures-site/blob/main/images/tgm-logo-icon.png?raw=true"
            alt="TGM Logo"
            width={60}
            height={60}
            style={{
              height: '60px',
              width: 'auto',
              transition: 'opacity 0.3s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          />
        </Link>
      </header>

      {/* Main Content */}
      <div 
        style={{
          maxWidth: '600px',
          width: '100%',
          margin: '0 auto',
          padding: '40px 20px',
          flex: 1
        }}
      >
        <h1 
          style={{
            fontSize: '36px',
            fontWeight: '700',
            marginBottom: '10px',
            color: '#111',
            fontFamily: 'Poppins, sans-serif',
            textAlign: 'center'
          }}
        >
          Contact Us
        </h1>
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
            color: '#155724',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #c3e6cb',
            marginBottom: '20px',
            display: 'block'
          }}>
            <p style={{
              margin: 0,
              fontFamily: 'Poppins, sans-serif'
            }}>
              Thank you! Your message has been sent successfully.
            </p>
          </div>
        )}

        {/* Error Message */}
        {submitStatus === 'error' && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #f5c6cb',
            marginBottom: '20px',
            display: 'block'
          }}>
            <p style={{
              margin: 0,
              fontFamily: 'Poppins, sans-serif'
            }}>
              There was an error sending your message. Please try again.
            </p>
          </div>
        )}

        {/* Contact Form */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '40px',
          borderRadius: '12px',
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
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '14px',
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
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '16px',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  boxSizing: 'border-box',
                  outline: 'none'
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
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '14px',
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
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '16px',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  boxSizing: 'border-box',
                  outline: 'none'
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
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '14px',
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
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '16px',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  boxSizing: 'border-box',
                  outline: 'none'
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
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '14px',
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
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '16px',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  boxSizing: 'border-box',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  outline: 'none'
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
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '14px',
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
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '16px',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  boxSizing: 'border-box',
                  outline: 'none'
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
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '14px',
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
                placeholder="Please provide details about your inquiry..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '16px',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  boxSizing: 'border-box',
                  minHeight: '120px',
                  resize: 'vertical',
                  outline: 'none'
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
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#666',
                textAlign: 'center',
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: isSubmitting ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                padding: '15px 40px',
                borderRadius: '8px',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s ease, transform 0.2s ease',
                width: '100%',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#0056b3'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#007bff'
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
      </div>

      <Footer />
    </div>
  )
}