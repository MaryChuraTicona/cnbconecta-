"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  ChevronDown,
  LogOut,
  Moon,
  Settings,
  Sun,
  UserCircle,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { useTheme } from "@/components/ThemeProvider";

export default function TopBar() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);

  const { dark, toggleTheme } = useTheme();

  const [usuario, setUsuario] = useState<any>(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const refUsuario = doc(db, "usuarios", user.uid);
      const snapUsuario = await getDoc(refUsuario);

      if (snapUsuario.exists()) {
        setUsuario(snapUsuario.data());
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    function cerrarAlClickFuera(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    }

    document.addEventListener("mousedown", cerrarAlClickFuera);
    return () => document.removeEventListener("mousedown", cerrarAlClickFuera);
  }, []);

  async function cerrarSesion() {
    await signOut(auth);
    router.push("/login");
  }

  const nombre = usuario?.nombre || "Usuario";
  const rol = formatearRol(usuario?.rol || usuario?.cargo || "Usuario");
  const iglesia =
    usuario?.iglesiaNombre ||
    usuario?.iglesia ||
    usuario?.churchName ||
    "Sin iglesia";

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200/70 bg-[#f7f8f7]/85 px-4 py-3 backdrop-blur-xl transition-colors dark:border-slate-800 dark:bg-slate-950/85 md:px-8">
      <div className="flex min-h-[60px] items-center justify-end gap-3">
        <button
          onClick={toggleTheme}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          {dark ? (
            <Sun size={18} className="text-yellow-400" />
          ) : (
            <Moon size={18} className="text-slate-700" />
          )}
        </button>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setAbierto(!abierto)}
            className="flex h-[52px] w-[290px] items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3 shadow-sm transition hover:border-gray-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#e8fff4] dark:bg-emerald-950">
              {usuario?.fotoUrl ? (
                <img
                  src={usuario.fotoUrl}
                  alt={nombre}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="text-[#16a36a]" size={22} />
              )}
            </div>

            <div className="min-w-0 flex-1 text-left leading-none">
              <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                {nombre}
              </p>

              <p className="mt-1 truncate text-xs font-medium text-gray-500 dark:text-slate-400">
                {rol} · {iglesia}
              </p>
            </div>

            <ChevronDown
              size={17}
              className={`shrink-0 text-gray-400 transition duration-200 dark:text-slate-500 ${
                abierto ? "rotate-180" : ""
              }`}
            />
          </button>

          {abierto && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[290px] overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_16px_50px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-900">
              <button
                onClick={() => {
                  setAbierto(false);
                  router.push("/perfil");
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <UserCircle size={18} />
                Perfil
              </button>

              <button
                onClick={() => {
                  setAbierto(false);
                  router.push("/configuracion");
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Settings size={18} />
                Configuración
              </button>

              <div className="my-2 h-px bg-gray-100 dark:bg-slate-700" />

              <button
                onClick={cerrarSesion}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <LogOut size={18} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function formatearRol(rol: string) {
  const roles: Record<string, string> = {
    admin: "Administrador",
    pastor_distrital: "Pastor distrital",
    comunicador_distrital: "Comunicador distrital",
    comunicador_iglesia: "Comunicador de iglesia",
    usuario: "Usuario",
  };

  return roles[rol] || rol;
}