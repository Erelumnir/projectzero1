import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Project Zero",
  description: "Game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
