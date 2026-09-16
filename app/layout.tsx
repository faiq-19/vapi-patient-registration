import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareCloud Voice AI Demo",
  description: "Voice AI patient registration technical assessment",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
