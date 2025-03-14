import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/shared/providers';

const plusJakartaSans = Plus_Jakarta_Sans({
  display: 'swap',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Splitbill App',
  description: 'Split your bill without worries',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.className}  antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
