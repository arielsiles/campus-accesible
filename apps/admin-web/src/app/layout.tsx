// FR-504: Root layout for admin panel
import type { Metadata } from "next";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Campus GPS Admin",
  description: "Panel de administración — Campus GPS Accesible",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          backgroundColor: "#f5f5f5",
          color: "#333",
        }}
      >
        <Header />
        <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
