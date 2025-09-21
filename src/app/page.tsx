'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background image with opacity */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(/images/tgm-warehouse.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Black overlay */}
      <div className="absolute inset-0 bg-black opacity-70 z-10" />

      <div className="min-h-screen text-white font-['Poppins'] flex flex-col justify-between items-center text-center relative z-20">
        {/* Main Content */}
        <div className="flex flex-col justify-center items-center flex-1">
          <div style={{ marginBottom: '0' }}>
            <Image
              src="https://github.com/tgmventures/tgmventures-site/blob/main/images/tgm-logo-icon.png?raw=true"
              alt="TGM Logo"
              width={150}
              height={150}
              className="w-[150px] h-[150px] max-w-[150px] max-h-[150px] object-contain block"
              style={{
                width: '150px',
                height: '150px',
                maxWidth: '150px',
                maxHeight: '150px',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>
          
          <div 
            style={{
              fontSize: '26px',
              fontWeight: '600',
              marginTop: '20px',
              padding: '0 5px',
              lineHeight: '1.3',
              fontFamily: 'Poppins, sans-serif'
            }}
          >
            We build, buy, and manage <br /> businesses and real estate.
          </div>
        </div>

        {/* Team Login Button - Above Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '15px',
          paddingBottom: '10px'
        }}>
          <Link 
            href="/login"
            className="inline-block text-white no-underline font-['Poppins'] transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'Poppins, sans-serif',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 255, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Team Login
          </Link>
        </div>

        {/* Footer */}
        <footer 
          className="w-full text-center"
          style={{
            width: '100%',
            padding: '15px 0',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ marginBottom: '5px' }}>
            <Link 
              href="/"
              className="no-underline transition-colors duration-300"
              style={{
                color: '#888',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '300',
                fontFamily: 'Poppins, sans-serif',
                margin: '0 15px',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'white' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#888' }}
            >
              Home
            </Link>
            <Link 
              href="/privacy-policy"
              className="no-underline transition-colors duration-300"
              style={{
                color: '#888',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '300',
                fontFamily: 'Poppins, sans-serif',
                margin: '0 15px',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'white' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#888' }}
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms-of-service"
              className="no-underline transition-colors duration-300"
              style={{
                color: '#888',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '300',
                fontFamily: 'Poppins, sans-serif',
                margin: '0 15px',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'white' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#888' }}
            >
              Terms of Service
            </Link>
            <Link 
              href="/contact"
              className="no-underline transition-colors duration-300"
              style={{
                color: '#888',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '300',
                fontFamily: 'Poppins, sans-serif',
                margin: '0 15px',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'white' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#888' }}
            >
              Contact
            </Link>
          </div>
          <p 
            style={{
              margin: '0',
              fontSize: '14px',
              fontWeight: '300',
              fontFamily: 'Poppins, sans-serif',
              color: '#666'
            }}
          >
            &copy; {new Date().getFullYear()} TGM Ventures, Inc. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  )
}