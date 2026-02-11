import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ApiLocaleProvider } from "@/components/providers/ApiLocaleProvider";
import { AuthProvider } from "@/contexts/auth-context";
import { LoginDialogProvider } from "@/components/providers/login-dialog-provider";
import { AuthRedirectHandler } from "@/components/auth/auth-redirect-handler";
import { isValidLocale, LOCALES } from '@interview-library/shared/i18n';

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: {
      template: `%s | ${t('title')}`,
      default: t('title')
    },
    description: t('description')
  };
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Ensure that the incoming `locale` is valid
  if (!isValidLocale(locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <LoginDialogProvider>
              <ApiLocaleProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  <AuthRedirectHandler />
                  {children}
                  <Toaster richColors position="top-right" />
                </ThemeProvider>
              </ApiLocaleProvider>
            </LoginDialogProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
