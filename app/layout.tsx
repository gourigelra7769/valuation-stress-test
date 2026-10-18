import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Valuation Stress Test",
  description: "Explore the assumptions behind a dated enterprise valuation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
