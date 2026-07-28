import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Steuerfix – Steuererklärung leicht gemacht",
  description:
    "Geführter Fragebogen zur Schätzung deiner Einkommensteuererstattung – zum Selbst-Einreichen bei ELSTER.",
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
