import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, contactReason, company, message } = body

    // Basic validation
    if (!name || !email || !contactReason || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Call the Firebase function (now deployed)
    const response = await fetch('https://us-central1-tgm-ventures-site.cloudfunctions.net/submitContactForm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        contactReason,
        company,
        message,
        recaptchaResponse: 'fallback-token' // We'll implement reCAPTCHA later
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to submit form')
    }

    const result = await response.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit form' },
      { status: 500 }
    )
  }
}
