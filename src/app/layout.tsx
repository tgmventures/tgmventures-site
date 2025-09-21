import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TGM Ventures',
  description: 'We build, buy, and manage businesses and real estate.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}