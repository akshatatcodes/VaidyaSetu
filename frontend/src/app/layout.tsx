import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ClerkProvider } from '@clerk/nextjs'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VaidyaSetu | AI Health Advisor",
  description: "India's First Hybrid AI Health & Drug Interaction Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} bg-gray-950 text-gray-100 flex min-h-screen overflow-hidden`}>
          <Sidebar />
          <main className="flex-1 p-8 sm:p-12 overflow-y-auto w-full">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
