import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
// Deployment trigger for reverted version
import { Providers } from '@/components/Providers';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins'
});

export const metadata: Metadata = {
  title: 'FreelanceHub — Client Management for Freelancers',
  description:
    'Replace WhatsApp chats and Excel sheets with one powerful workspace. Manage clients, projects, invoices, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
