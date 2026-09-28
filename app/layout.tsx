import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://citatica.com"),

  title: {
    default: "CitaTica | Reservas fáciles para tu negocio",
    template: "%s | CitaTica",
  },

  description:
    "CitaTica ayuda a barberías, salones, uñas, tatuajes y otros negocios a recibir reservas en línea, organizar su agenda, clientes, servicios, profesionales y recordatorios desde un solo lugar.",

  applicationName: "CitaTica",

  keywords: [
    "CitaTica",
    "reservas en línea",
    "agenda de citas",
    "barberías",
    "salones de belleza",
    "uñas",
    "tatuajes",
    "agenda online",
    "Costa Rica",
  ],

  authors: [
    {
      name: "CitaTica",
    },
  ],

  creator: "CitaTica",
  publisher: "CitaTica",

  icons: {
    icon: [
      {
        url: "/brand/favicon.png",
        type: "image/png",
      },
    ],
    shortcut: "/brand/favicon.png",
    apple: "/brand/favicon.png",
  },

  openGraph: {
    title: "CitaTica | Reservas fáciles para tu negocio",
    description:
      "Recibe reservas las 24 horas, organiza tu agenda y administra clientes, servicios y profesionales desde un solo lugar.",
    url: "https://citatica.com",
    siteName: "CitaTica",
    locale: "es_CR",
    type: "website",
    images: [
      {
        url: "/brand/citatica-logo.png",
        width: 1200,
        height: 630,
        alt: "CitaTica",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "CitaTica | Reservas fáciles para tu negocio",
    description:
      "Recibe reservas las 24 horas y organiza tu negocio desde un solo lugar.",
    images: ["/brand/citatica-logo.png"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0066FF",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}