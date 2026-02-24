import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { LocaleProvider } from "@/lib/i18n/config";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const siteUrl = "https://tweaklog.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Tweaklog — Ad Change Logs × Impact Analysis × AI Insights",
    template: "%s | Tweaklog",
  },
  description:
    "Track every ad change, automatically measure its impact on KPIs, and get AI-powered insights. The all-in-one platform for Google Ads, Meta Ads, and more.",
  keywords: [
    "広告運用",
    "変更ログ",
    "AI分析",
    "CPA改善",
    "ROAS",
    "Google Ads",
    "Meta Ads",
    "広告レポート",
    "SaaS",
    "Tweaklog",
  ],
  authors: [{ name: "Tweaklog" }],
  creator: "Tweaklog",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "ja_JP",
    alternateLocale: "en_US",
    url: siteUrl,
    siteName: "Tweaklog",
    title: "Tweaklog — Ad Change Logs × Impact Analysis × AI Insights",
    description:
      "Track every ad change, automatically measure its impact on KPIs, and get AI-powered insights. The all-in-one platform for Google Ads, Meta Ads, and more.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tweaklog — Log the tweak. See the lift.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tweaklog — Ad Change Logs × Impact Analysis × AI Insights",
    description:
      "Track every ad change, automatically measure its impact on KPIs, and get AI-powered insights. The all-in-one platform for Google Ads, Meta Ads, and more.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased overflow-x-hidden`}
      >
        <LocaleProvider>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </LocaleProvider>
      </body>
    </html>
  );
}
