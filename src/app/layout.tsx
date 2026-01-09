import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://faviconlint.com"),
  title: {
    default: "FaviconLint - Check Your Favicon Setup",
    template: "%s | FaviconLint",
  },
  description: "Free tool to check if your favicon is set up correctly for all browsers and platforms. Get actionable recommendations to improve your site's appearance in search results.",
  keywords: ["favicon", "favicon checker", "favicon validator", "favicon lint", "favicon tester", "website icon", "favicon generator", "favicon test"],
  authors: [{ name: "FaviconLint" }],
  creator: "FaviconLint",
  publisher: "FaviconLint",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "FaviconLint - Check Your Favicon Setup",
    description: "Free tool to check if your favicon is set up correctly for all browsers and platforms. Get actionable fixes in seconds.",
    type: "website",
    locale: "en_US",
    url: "https://faviconlint.com",
    siteName: "FaviconLint",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FaviconLint - Favicon not showing? Find out why.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FaviconLint - Check Your Favicon Setup",
    description: "Free tool to check if your favicon is set up correctly for all browsers and platforms. Get actionable fixes in seconds.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
