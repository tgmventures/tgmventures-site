'use client'

import Link from 'next/link'
import Image from 'next/image'
import Footer from './Footer'

interface LegalPageLayoutProps {
  title: string
  children: React.ReactNode
}

export default function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
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
            src="/images/tgm-logo-icon.png"
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
          maxWidth: '800px',
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
            fontFamily: 'Poppins, sans-serif'
          }}
        >
          {title}
        </h1>
        <div 
          style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '30px',
            fontFamily: 'Poppins, sans-serif'
          }}
        >
          <strong>Effective Date:</strong> September 19, 2025<br />
          <strong>Last Updated:</strong> September 19, 2025
        </div>
        <div style={{ fontFamily: 'Poppins, sans-serif' }}>
          {children}
        </div>
      </div>

      <Footer />
    </div>
  )
}
