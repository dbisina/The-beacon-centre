// app/layout.tsx - Root layout with providers

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'The Beacon Centre Admin',
  description: 'Admin dashboard for managing The Beacon Centre content',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn(inter.className, 'min-h-screen bg-background font-sans antialiased')}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}