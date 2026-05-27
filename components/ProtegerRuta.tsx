"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";

type Permiso =
  | "usuarios"
  | "iglesias"
  | "ministerios"
  | "directorio"
  | "anuncios"
  | "aprobarAnuncios"
  | "envios"
  | "historial"
  | "evidencias"
  | "poa"
  | "reportes";

export default function ProtegerRuta({
  permiso,
  children,
}: {
  permiso: Permiso;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [permitido, setPermitido] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const refUsuario = doc(db, "usuarios", user.uid);
      const snapUsuario = await getDoc(refUsuario);

      if (!snapUsuario.exists()) {
        await signOut(auth);
        router.push("/login");
        return;
      }

      const usuario = snapUsuario.data();

      if (usuario.activo === false) {
        await signOut(auth);
        router.push("/login");
        return;
      }

      const tienePermiso =
        usuario.rol === "admin" || usuario.permisos?.[permiso] === true;

      if (!tienePermiso) {
        router.push("/");
        return;
      }

      setPermitido(true);
      setCargando(false);
    });

    return () => unsubscribe();
  }, [router, permiso]);

  if (cargando) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="h-6 w-52 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 h-4 w-80 animate-pulse rounded bg-slate-100" />
      </div>
    );
  }

  if (!permitido) return null;

  return <>{children}</>;
}