import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  metadataBase: new URL("https://dahabsoftware.online"),
  title: "نور دهب - رفيق المكفوفين الذكي | Dahab Software",
  description: "نظام ومساعد بصري ذكي فائق السرعة مخصص لخدمة الأشخاص المكفوفين وضعاف البصر في مصر والوطن العربي. ابتكار وتطوير المهندس إسلام أبو دهب - شركة دهب سوفتوير.",
  keywords: [
    "نور دهب",
    "تطبيق مكفوفين",
    "الذكاء الاصطناعي للمكفوفين",
    "مساعد بصري",
    "دهب سوفتوير",
    "مهندس إسلام أبو دهب",
    "Dahab Software",
    "Noor Dahab",
    "Blind Assistant AI",
    "قارئ نصوص للمكفوفين",
    "فحص العملات المصرية",
    "مساعد المترو للمكفوفين",
    "تطبيق لفاقدي البصر"
  ],
  authors: [
    { name: "المهندس إسلام أبو دهب", url: "https://dahabsoftware.com" }
  ],
  creator: "المهندس إسلام أبو دهب - Dahab Software",
  publisher: "Dahab Software",
  manifest: "/manifest.json",
  verification: {
    google: "aVb6lwoYXazxh6uE2Dvidd-mMasOJpfMfEFLghrTTQ8",
  },
  alternates: {
    canonical: "https://dahabsoftware.online"
  },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: "https://dahabsoftware.online",
    siteName: "نور دهب - Dahab Software",
    title: "نور دهب - رفيق المكفوفين الذكي | Dahab Software",
    description: "أقوى مساعد بصري صوتي ذكي للمكفوفين يدمج الكاميرا وتحليل الذكاء الاصطناعي الفوري ومكبر الصوت مجاناً 100%.",
    images: [
      {
        url: "https://dahabsoftware.online/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dahab Software - نور دهب رفيق المكفوفين الذكي",
      },
      {
        url: "https://dahabsoftware.online/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "شعار Dahab Software",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "نور دهب - رفيق المكفوفين الذكي | Dahab Software",
    description: "مساعد بصري ذكي مخصص للمكفوفين في مصر والوطن العربي - Dahab Software",
    images: ["https://dahabsoftware.online/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "نور دهب",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="h-full" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="google-site-verification" content="aVb6lwoYXazxh6uE2Dvidd-mMasOJpfMfEFLghrTTQ8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "نور دهب - رفيق المكفوفين الذكي",
              "alternateName": "Noor Dahab - Dahab Software",
              "url": "https://dahabsoftware.online",
              "image": "https://dahabsoftware.online/og-image.png",
              "description": "أقوى نظام ومساعد بصري ذكي فائق السرعة لخدمة الأشخاص المكفوفين وضعاف البصر في مصر والوطن العربي.",
              "applicationCategory": "AccessibilityApplication",
              "operatingSystem": "All (Web, Android, iOS)",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EGP"
              },
              "author": {
                "@type": "Person",
                "name": "المهندس إسلام أبو دهب",
                "url": "https://dahabsoftware.com"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Dahab Software",
                "url": "https://dahabsoftware.online",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://dahabsoftware.online/icons/icon-512.png"
                }
              }
            })
          }}
        />
      </head>
      <body className="bg-dark-900 text-white h-full w-full overflow-hidden" style={{ fontFamily: "'Cairo', sans-serif" }} suppressHydrationWarning>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}