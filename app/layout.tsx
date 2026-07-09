import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Orbitron } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { Toaster } from "@/components/ui/sonner";

const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const displayFont = Orbitron({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Solo Leveling Challenge",
  description: "Log your daily workouts, diet, sleep, and steps — level up with your crew.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <NavBar />
        <main className="flex flex-1 flex-col pb-20 lg:pb-0">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
