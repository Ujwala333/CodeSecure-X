import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import ToastProvider from "@/components/ToastProvider";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "CodeSecureX — LLM Vulnerability Scanner",
  description:
    "Detect vulnerabilities using CodeSecureX in seconds. Paste or upload code and instantly detect security vulnerabilities powered by AI. Get severity ratings, explanations, and fix suggestions.",
  keywords: ["security", "vulnerability scanner", "AI", "code review", "OWASP"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[hsl(222,47%,5%)] antialiased">
        <AuthProvider>
          <Navbar />
          <main className="pt-16">{children}</main>
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  );
}
