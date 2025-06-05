import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'AutoBuzz - Never Miss Stock Again',
    description: 'Get instant notifications when your favorite products are back in stock',
    keywords: 'stock alerts, product notifications, inventory tracking, e-commerce',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body className={inter.className}>
        {children}
        </body>
        </html>
    );
}