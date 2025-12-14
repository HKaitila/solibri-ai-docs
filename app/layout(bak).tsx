import type { Metadata } from "next";
import '@/styles/solibri-theme.css';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: "Release Notes Analyzer",
  description: "Analyze release notes and get smart documentation recommendations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
