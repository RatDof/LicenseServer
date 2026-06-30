import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import React from 'react';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'LicenseServer - License Management Platform',
  description: 'Professional self-hosted authentication and license management platform',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="animated-gradient-bg min-h-screen antialiased">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="relative z-10">
  <Providers>
    {children}
  </Providers>
</div>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(17,17,27,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#f1f5f9',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#0a0a0f' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0a0a0f' } },
          }}
        />
      </body>
    </html>
  );
}
