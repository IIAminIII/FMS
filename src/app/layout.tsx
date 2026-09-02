import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Saturday Football Fund Manager", template: "%s · Saturday Football" },
  description: "Simple weekly football attendance, payments, expenses and fund tracking.",
};

export const viewport: Viewport = { themeColor: "#123d2b" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={GeistSans.className} data-scroll-behavior="smooth"><body className="antialiased"><Toaster richColors position="top-right" />{children}</body></html>;
}
