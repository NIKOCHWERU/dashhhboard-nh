import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { Providers } from './providers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: "%s | Narasumber Hukum",
    default: "Dashboard | Narasumber Hukum",
  },
  description: "Kantor Hukum Narasumber Hukum",
  icons: {
    icon: "/images/logo/logo-icon.svg",
    shortcut: "/images/logo/logo-icon.svg",
    apple: "/images/logo/logo-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="dark:bg-gray-900" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

