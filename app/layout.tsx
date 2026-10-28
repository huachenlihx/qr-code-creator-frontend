import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://qrcode.founderdesigngroup.ca'),
  title: 'Free QR Code Creator | Founder Design Group',
  description:
    'Create QR codes for URLs, plain text, Wi-Fi credentials, contact cards, calendar events, and app actions. Download PNG, SVG, PDF, and other ready-to-use QR assets in one ZIP package.',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://qrcode.founderdesigngroup.ca/',
    siteName: 'Founder Design Group QR Code Creator',
    title: 'Free QR Code Creator | Founder Design Group',
    description:
      'Create and download QR codes for websites, plain text, Wi-Fi, contacts, calendar events, and app actions.',
  },
  twitter: {
    card: 'summary',
    title: 'Free QR Code Creator | Founder Design Group',
    description:
      'Create QR codes for URLs, text, Wi-Fi, contacts, calendar events, and app actions, then download a complete ZIP package.',
  },
};



export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
