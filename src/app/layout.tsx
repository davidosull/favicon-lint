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
  title: "FaviconLint - Check Your Favicon Setup",
  description: "Free tool to check if your favicon is set up correctly for all browsers and platforms. Get actionable recommendations to improve your site's appearance in search results.",
  keywords: ["favicon", "favicon checker", "favicon validator", "favicon lint", "favicon tester", "website icon"],
  authors: [{ name: "FaviconLint" }],
  openGraph: {
    title: "FaviconLint - Check Your Favicon Setup",
    description: "Free tool to check if your favicon is set up correctly for all browsers and platforms.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "FaviconLint - Check Your Favicon Setup",
    description: "Free tool to check if your favicon is set up correctly for all browsers and platforms.",
  },
  robots: {
    index: true,
    follow: true,
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
