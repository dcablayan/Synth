import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Synth — Evidence-Backed AI Diligence',
  description: 'Evidence-backed AI diligence for mixed legal and financial document packets. Local-first, CLI-driven, and mock by default.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white text-gray-900 min-h-screen">{children}</body>
    </html>
  );
}
