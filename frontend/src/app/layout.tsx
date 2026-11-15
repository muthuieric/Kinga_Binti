import type { Metadata } from "next";

import ClientLayout from "./client-layout";

export const metadata: Metadata = {
  title: "Kinga Binti — Community Narrative Monitor",
  description: "Bilingual, consent-first AI for monitoring FGM and child marriage signals in Narok and Kajiado.",
  metadataBase: new URL("https://kingabinti.example.com"),
  openGraph: {
    type: "website",
    title: "Kinga Binti — Community Narrative Monitor",
    description: "Bilingual, consent-first AI for monitoring FGM and child marriage signals in Narok and Kajiado.",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}