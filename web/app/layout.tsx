import type { Metadata } from "next";
import { Archivo, Archivo_Black, JetBrains_Mono } from "next/font/google";
import { Footer } from "@/components/Footer";
import "./globals.css";

const body = Archivo({ variable: "--font-body", subsets: ["latin"] });
const display = Archivo_Black({ variable: "--font-display", subsets: ["latin"], weight: "400" });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PUBLIC_SITE_URL || "https://dota2-translate-ptbr.sites.openai.com"),
  title: { default: "Dota 2 Translate PT-BR", template: "%s · Dota 2 Translate PT-BR" },
  description: "Todos os heróis e o narrador padrão de Dota 2 em português brasileiro.",
  icons: { icon: "/og.png", shortcut: "/og.png" },
  openGraph: {
    title: "Dota 2 Translate PT-BR",
    description: "127 heróis, um narrador e uma comunidade construindo Dota 2 em português brasileiro.",
    locale: "pt_BR",
    type: "website",
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${body.variable} ${display.variable} ${mono.variable}`}>
        {children}
        <Footer />
      </body>
    </html>
  );
}
