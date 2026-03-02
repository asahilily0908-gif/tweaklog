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
    default: "Tweaklog — 広告運用の効果分析・改善提案SaaS",
    template: "%s | Tweaklog",
  },
  description:
    "広告運用の変更ログを記録し、AIがKPIへのインパクトを自動分析。CTR・CVR・ROASの改善サイクルを加速します。",
  keywords: [
    "広告運用",
    "変更ログ",
    "AI分析",
    "CPA改善",
    "CTR",
    "CVR",
    "ROAS",
    "Google Ads",
    "Meta Ads",
    "Yahoo! Ads",
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
    title: "Tweaklog — 広告運用の効果分析・改善提案SaaS",
    description:
      "広告運用の変更ログを記録し、AIがKPIへのインパクトを自動分析。CTR・CVR・ROASの改善サイクルを加速します。",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tweaklog — 広告運用の効果分析・改善提案SaaS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tweaklog — 広告運用の効果分析・改善提案SaaS",
    description:
      "広告運用の変更ログを記録し、AIがKPIへのインパクトを自動分析。CTR・CVR・ROASの改善サイクルを加速します。",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "usdnT-mK-E-Nq5o9ZajQzAGn6A_8RaWnQgTsOOrxEYo",
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
