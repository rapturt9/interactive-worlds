import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interactive Worlds",
  description: "Immersive text-based adventures with persistent worlds",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className="antialiased h-full">
          <div className="h-full">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}
