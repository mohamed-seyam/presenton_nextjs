import type { Metadata } from "next";
import localFont from "next/font/local";
import { Roboto, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import MixpanelInitializer from "./MixpanelInitializer";
import { LayoutProvider } from "./(presentation-generator)/context/LayoutContext";
import { Toaster } from "@/components/ui/sonner";
const inter = localFont({
  src: [
    {
      path: "./fonts/Inter.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-inter",
});

const instrument_sans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-instrument-sans",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-roboto",
});


export const metadata: Metadata = {
  metadataBase: new URL("https://slidegen.app"),
  title: "Slidegen - AI-Powered Presentation Generator",
  description:
    "Create stunning presentations with Slidegen's AI-powered platform. Multi-model support (OpenAI, Gemini, Ollama), custom layouts, and PDF/PPTX export.",
  keywords: [
    "AI presentation generator",
    "Slidegen",
    "data storytelling",
    "data visualization tool",
    "AI data presentation",
    "presentation generator",
    "data to presentation",
    "interactive presentations",
    "professional slides",
    "slide generator",
  ],
  openGraph: {
    title: "Slidegen - AI-Powered Presentation Generator",
    description:
      "Create stunning presentations with Slidegen's AI-powered platform. Multi-model support, custom layouts, and professional export options.",
    url: "https://slidegen.app",
    siteName: "Slidegen",
    images: [
      {
        url: "https://slidegen.app/slidegen-feature-graphics.png",
        width: 1200,
        height: 630,
        alt: "Slidegen Logo",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  alternates: {
    canonical: "https://slidegen.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Slidegen - AI-Powered Presentation Generator",
    description:
      "Create stunning presentations with Slidegen's AI-powered platform. Multi-model support, custom layouts, and professional export options.",
    images: ["https://slidegen.app/slidegen-feature-graphics.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${roboto.variable} ${instrument_sans.variable} antialiased`}
      >
        <Providers>
          <MixpanelInitializer>
            <LayoutProvider>
              {children}
            </LayoutProvider>
          </MixpanelInitializer>
        </Providers>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
