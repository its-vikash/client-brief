import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans, Space_Mono } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PreConvara — Prepare for better client conversations",
  description:
    "Turn prospect information into a sharp, structured client brief before every sales or discovery call. PreConvara helps freelancers and agencies walk into every meeting fully prepared.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`h-full ${bricolage.variable} ${dmSans.variable} ${spaceMono.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="h-full" style={{ background: "var(--bg-canvas)" }}>
        {children}
      </body>
    </html>
  );
}
