'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer 
      style={{
        backgroundColor: 'black',
        color: 'white',
        textAlign: 'center',
        padding: '20px 0',
        borderTop: 'none',
        fontFamily: 'Poppins, sans-serif'
      }}
    >
      <Link 
        href="/"
        style={{
          color: '#888',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '300',
          margin: '0 15px',
          fontFamily: 'Poppins, sans-serif',
          transition: 'color 0.3s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'white' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#888' }}
      >
        Home
      </Link>
      <Link 
        href="/privacy-policy"
        style={{
          color: '#888',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '300',
          margin: '0 15px',
          fontFamily: 'Poppins, sans-serif',
          transition: 'color 0.3s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'white' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#888' }}
      >
        Privacy Policy
      </Link>
      <Link 
        href="/terms-of-service"
        style={{
          color: '#888',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '300',
          margin: '0 15px',
          fontFamily: 'Poppins, sans-serif',
          transition: 'color 0.3s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'white' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#888' }}
      >
        Terms of Service
      </Link>
      <Link 
        href="/contact"
        style={{
          color: '#888',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '300',
          margin: '0 15px',
          fontFamily: 'Poppins, sans-serif',
          transition: 'color 0.3s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'white' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#888' }}
      >
        Contact
      </Link>
      <p 
        style={{
          margin: '10px 0 0 0',
          fontSize: '14px',
          fontWeight: '300',
          color: '#666',
          fontFamily: 'Poppins, sans-serif'
        }}
      >
        &copy; {new Date().getFullYear()} TGM Ventures, Inc. All rights reserved.
      </p>
    </footer>
  )
}
