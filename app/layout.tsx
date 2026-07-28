import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Steuerfix – Steuererklärung leicht gemacht",
  description:
    "Geführter Fragebogen zur Schätzung deiner Einkommensteuererstattung – zum Selbst-Einreichen bei ELSTER.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f9d63",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
