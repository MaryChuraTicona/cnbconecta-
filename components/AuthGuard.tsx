"use client";

import { ReactNode, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === "/login") {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        setLoading(false);
        return;
      }

      const refUsuario = doc(db, "usuarios", user.uid);
      const snapUsuario = await getDoc(refUsuario);

      if (!snapUsuario.exists()) {
        await signOut(auth);
        router.push("/login");
        setLoading(false);
        return;
      }

      const datos = snapUsuario.data();

      if (datos.activo === false) {
        await signOut(auth);
        router.push("/login");
        setLoading(false);
        return;
      }

      if (pathname.startsWith("/usuarios") && datos.rol !== "admin") {
        router.push("/");
        setLoading(false);
        return;
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Cargando CNB Conecta+...</p>
      </main>
    );
  }

  return <>{children}</>;
}