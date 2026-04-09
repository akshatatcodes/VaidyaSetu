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
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 text-gray-100 flex flex-col md:flex-row min-h-screen`}>
        <ClerkProvider>
          <Sidebar />
          <main className="flex-1 p-4 sm:p-8 md:p-12 w-full">
            {children}
          </main>
        </ClerkProvider>
      </body>
    </html>
  );
}
