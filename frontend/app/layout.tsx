import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GovTender Scout - Government Tender Auto-Scanner",
  description: "AI-powered tender matching for Indian businesses. Get daily WhatsApp & email alerts for government tenders you actually qualify for.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
