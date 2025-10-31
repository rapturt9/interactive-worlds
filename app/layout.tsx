import type { Metadata } from "next";
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
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
