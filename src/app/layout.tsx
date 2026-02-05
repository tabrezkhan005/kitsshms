import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Merriweather, Lato } from "next/font/google";
import "./globals.css";

// Font configurations for the seminar hall management system
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Merriweather font for headings (Bold)
const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["700", "900"], // Bold and Black weights
});

// Lato font for subheadings and UI (Bold, Regular)
const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"], // Regular and Bold weights
});

export const metadata: Metadata = {
  title: "KITS Seminar Hall Management System",
  description: "Efficient seminar hall booking and management system for KITS college",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${merriweather.variable} ${lato.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
