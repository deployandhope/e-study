import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "eStudy Dashboard",
  description: "Analytics dashboard voor eStudy domeinen",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className={`${manrope.variable} h-full`}>
      <body className="h-full flex">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
