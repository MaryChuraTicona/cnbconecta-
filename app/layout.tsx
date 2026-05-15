"use client";

import "./globals.css";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const esLogin = pathname === "/login";

  return (
    <html lang="es">
      <body className="bg-gray-100">
        {esLogin ? (
          <>{children}</>
        ) : (
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 p-6 md:ml-0">{children}</main>
          </div>
        )}
      </body>
    </html>
  );
}