import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Déclic, réviser la photo",
  description: "Jeu de révision des cours du club photo : exposition, stops, vocabulaire et réglages du boîtier.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d0e10",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} antialiased`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
