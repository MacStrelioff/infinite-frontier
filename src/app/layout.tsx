import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Infinite Frontier - AI NFT Generation',
  description: 'Generate unique AI images and mint them as onchain NFTs on Base',
  keywords: ['NFT', 'AI', 'Base', 'Ethereum', 'Image Generation', 'Onchain'],
  openGraph: {
    title: 'Infinite Frontier',
    description: 'AI-Powered NFT Generation on Base',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
