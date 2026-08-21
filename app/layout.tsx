import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: "مدرسة الصومعه | نظام الإدارة",
  description: "نظام متكامل لإدارة مدرسة الصومعه",
  openGraph: { title: "مدرسة الصومعه", description: "نظام الإدارة المدرسية", images: ["/og.png"] },
  twitter: { card: "summary_large_image", title: "مدرسة الصومعه", description: "نظام الإدارة المدرسية", images: ["/og.png"] },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
      </body>
    </html>
  );
}
