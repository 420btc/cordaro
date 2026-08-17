import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cordaro Monitor · Incoming Energy by Magnetic Anomaly',
  description: 'Visual monitor of incoming energy by magnetic anomaly, Moon and Sun positions, tectonic plate crossings and global seismic activity.',
  icons: {
    icon: [{ url: '/iconocordaro.png', type: 'image/png' }],
    apple: '/iconocordaro.png',
  },
  openGraph: {
    title: 'Cordaro Monitor · Incoming Energy by Magnetic Anomaly',
    description: 'Visual monitor of incoming energy by magnetic anomaly, Moon and Sun positions, tectonic plate crossings and global seismic activity.',
    type: 'website',
    images: [{ url: '/cordaro.png', alt: 'Cordaro Monitor · Incoming Energy by Magnetic Anomaly' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cordaro Monitor · Incoming Energy by Magnetic Anomaly',
    description: 'Visual monitor of incoming energy by magnetic anomaly, Moon and Sun positions, tectonic plate crossings and global seismic activity.',
    images: ['/cordaro.png'],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-[#0e1116]">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
