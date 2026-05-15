import type { Metadata } from "next";
import "./globals.css";

import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "CNB Conecta+",
  description:
    "Plataforma Oficial del Distrito Misionero Ciudad Nueva B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <main className="min-h-screen bg-gray-100 flex">
          <Sidebar />

          <section className="flex-1 p-4 pt-20 md:p-6">
            {children}
          </section>
        </main>
      </body>
    </html>
  );
}