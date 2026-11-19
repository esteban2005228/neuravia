import type { Metadata, Viewport } from "next";
import { Montserrat, Nunito_Sans } from "next/font/google";

import "./globals.css";

const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], weight: ["500", "600", "700"] });
const nunitoSans = Nunito_Sans({ variable: "--font-nunito-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Neuravia", template: "%s · Neuravia" },
  description: "Evalúa tu atención y memoria y recibe sugerencias para cuidarlas.",
};

export const viewport: Viewport = {
  themeColor: "#f7f9fc",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${montserrat.variable} ${nunitoSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
