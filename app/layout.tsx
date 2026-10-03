// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Memories",
  description: "Aplikasi kenangan spesial kita berdua",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        {/* Tambahkan tag viewport ini agar halaman tidak bisa di-zoom */}
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" 
        />
        {/* Logo birunya di tab browser */}
        <link rel="icon" href="/icon-192.png" type="image/png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
