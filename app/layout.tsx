"use client";

import "./globals.css";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import TopBar from "@/components/TopBar";

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
        <AuthGuard>
          {esLogin ? (
            <>{children}</>
          ) : (
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 min-w-0">
  <TopBar />
  <div className="p-4 md:p-6">
    {children}
  </div>
</main>
            </div>
          )}
        </AuthGuard>
      </body>
    </html>
  );
}