import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Polices du design system WAMI, servies localement (aucun appel à Google Fonts).
const dmSans = localFont({
  variable: "--font-dm-sans",
  src: [
    { path: "./fonts/DMSans-Regular.ttf", weight: "400" },
    { path: "./fonts/DMSans-Medium.ttf", weight: "500" },
    { path: "./fonts/DMSans-SemiBold.ttf", weight: "600" },
    { path: "./fonts/DMSans-Bold.ttf", weight: "700" },
  ],
});

const unbounded = localFont({
  variable: "--font-unbounded",
  src: [{ path: "./fonts/Unbounded-Bold.ttf", weight: "700" }],
});

export const metadata: Metadata = {
  title: { default: "WAMI Admin", template: "%s · WAMI Admin" },
  description: "Back-office WAMI : opérations, partenaires, établissements, finances.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${dmSans.variable} ${unbounded.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
