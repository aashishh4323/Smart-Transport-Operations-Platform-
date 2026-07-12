import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { AppStateProvider } from "@/lib/app-state-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "TransitOps",
  description: "Smart Transport Operations Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppStateProvider>
            {children}
          </AppStateProvider>
        </AuthProvider>
      </body>
    </html>
  );
}