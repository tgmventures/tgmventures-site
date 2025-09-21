'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer 
      style={{
        backgroundColor: '#f8f8f8',
        padding: '20px 0',
        textAlign: 'center',
        borderTop: '1px solid #ddd',
        fontFamily: 'Poppins, sans-serif'
      }}
    >
      <div style={{ marginBottom: '8px' }}>
        <Link 
          href="/"
          style={{
            color: '#666',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '400',
            margin: '0 15px',
            fontFamily: 'Poppins, sans-serif',
            transition: 'color 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#000' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#666' }}
        >
          Home
        </Link>
        <Link 
          href="/privacy-policy"
          style={{
            color: '#666',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '400',
            margin: '0 15px',
            fontFamily: 'Poppins, sans-serif',
            transition: 'color 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#000' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#666' }}
        >
          Privacy Policy
        </Link>
        <Link 
          href="/terms-of-service"
          style={{
            color: '#666',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '400',
            margin: '0 15px',
            fontFamily: 'Poppins, sans-serif',
            transition: 'color 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#000' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#666' }}
        >
          Terms of Service
        </Link>
        <Link 
          href="/contact"
          style={{
            color: '#666',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '400',
            margin: '0 15px',
            fontFamily: 'Poppins, sans-serif',
            transition: 'color 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#000' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#666' }}
        >
          Contact
        </Link>
      </div>
      <p 
        style={{
          fontSize: '12px',
          color: '#999',
          margin: 0,
          fontFamily: 'Poppins, sans-serif'
        }}
      >
        &copy; {new Date().getFullYear()} TGM Ventures, Inc. All rights reserved.
      </p>
    </footer>
  )
}
