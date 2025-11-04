import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import QueryProvider from '../components/QueryProvider';
import './globals.css';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'BagXtra - Peer-to-Peer Logistics Platform',
  description:
    'Connect shoppers, travelers, and vendors in a seamless logistics platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${manrope.variable} antialiased`}>
        <ClerkProvider>
          <QueryProvider>
            {/* <header className='flex justify-between items-center p-4 bg-white border-b'>
              <h1 className='text-xl font-bold'>BagXtra</h1>
              <SignedOut>
                <div className='flex gap-2'>
                  <SignInButton />
                  <SignUpButton />
                </div>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </header> */}
            {children}
          </QueryProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
