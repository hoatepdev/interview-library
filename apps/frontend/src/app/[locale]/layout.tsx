import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { MainLayout } from "@/components/layout/MainLayout";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Interview Library",
  description: "Master your interview skills",
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Ensure that the incoming `locale` is valid
  if (!['en', 'vi'].includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <MainLayout>{children}</MainLayout>
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
