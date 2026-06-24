import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aesthetics-place.rapidnextech.com"),
  title: "Aesthetics Place — Live WhatsApp Concierge",
  description:
    "Monitor and respond to patient WhatsApp bookings in real time. Powered by RapidNexTech AI.",
  icons: {
    icon: "/favicon-192.png",
    apple: "/favicon-192.png",
    shortcut: "/favicon-192.png",
  },
  openGraph: {
    title: "Aesthetics Place — Live WhatsApp Concierge",
    description:
      "Monitor and respond to patient WhatsApp bookings in real time. Powered by RapidNexTech AI.",
    url: "https://aesthetics-place.rapidnextech.com",
    siteName: "Aesthetics Place",
    images: [
      {
        url: "/favicon-192.png",
        width: 192,
        height: 192,
        alt: "Aesthetics Place logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Aesthetics Place — Live WhatsApp Concierge",
    description:
      "Monitor and respond to patient WhatsApp bookings in real time. Powered by RapidNexTech AI.",
    images: ["/favicon-192.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
