// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import '../styles/globals.css';
import { Providers } from './providers';
import Navbar from '../components/layout/navbar';
import Footer from '../components/layout/footer';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_PROJECT_DISPLAY_NAME || '{{PROJECT_DISPLAY_NAME}}',
  description: process.env.NEXT_PUBLIC_PROJECT_DESCRIPTION || '{{PROJECT_DESCRIPTION}}',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable}`}>
        <Providers>
          <div className="flex flex-col min-h-screen bg-background font-sans antialiased">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}