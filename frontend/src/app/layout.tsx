export const runtime = 'nodejs'

import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { ToastContainer } from 'react-toastify';
import { QueryProvider } from "@/components/providers/queryProvider";

export const metadata: Metadata = {
  title: "LTC Express Dashboard",
  description: "LTC Express Management Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="smooth-scroll">
      <body
        className={`antialiased bg-six dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200 min-h-screen`}
        suppressHydrationWarning
      >
        <Toaster position='top-center' reverseOrder={false} />
        <ToastContainer position="bottom-right" />
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}

