"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  BarChart3,
  Building2,
  CalendarCheck,
  Church,
  FileCheck2,
  History,
  Images,
  LogOut,
  Megaphone,
  Menu,
  Send,
  Users,
  X,
} from "lucide-react";

import {
  auth,
  db,
} from "@/lib/firebase";

type Permisos = {
  usuarios?: boolean;
  iglesias?: boolean;
  ministerios?: boolean;
  directorio?: boolean;
  anuncios?: boolean;
  aprobarAnuncios?: boolean;
  envios?: boolean;
  historial?: boolean;
  evidencias?: boolean;
  poa?: boolean;
};

type UsuarioSistema = {
  nombre?: string;
  rol?: string;
  activo?: boolean;
  permisos?: Permisos;
};

const linksBase = [
  {
    nombre: "Dashboard",
    href: "/",
    icono: BarChart3,
    permiso: "dashboard",
  },

  {
    nombre: "Iglesias",
    href: "/iglesias",
    icono: Church,
    permiso: "iglesias",
  },

  {
    nombre: "Ministerios",
    href: "/ministerios",
    icono: Building2,
    permiso: "ministerios",
  },

  {
    nombre: "Directorio",
    href: "/directorio",
    icono: Users,
    permiso: "directorio",
  },

  {
    nombre: "Anuncios",
    href: "/anuncios",
    icono: Megaphone,
    permiso: "anuncios",
  },

  {
    nombre: "Aprobaciones",
    href: "/aprobaciones",
    icono: FileCheck2,
    permiso: "aprobarAnuncios",
  },

  {
    nombre: "Envíos",
    href: "/envios",
    icono: Send,
    permiso: "envios",
  },

  {
    nombre: "Historial",
    href: "/historial-envios",
    icono: History,
    permiso: "historial",
  },

  {
    nombre: "Evidencias",
    href: "/evidencias",
    icono: Images,
    permiso: "evidencias",
  },

  {
    nombre: "POA",
    href: "/poa",
    icono: CalendarCheck,
    permiso: "poa",
  },

  {
    nombre: "Usuarios",
    href: "/usuarios",
    icono: Users,
    permiso: "usuarios",
  },
];

export default function Sidebar() {
  const router = useRouter();

  const pathname = usePathname();

  const [abierto, setAbierto] =
    useState(false);

  const [usuario, setUsuario] =
    useState<UsuarioSistema | null>(
      null
    );

  const [cargando, setCargando] =
    useState(true);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          if (!user) {
            router.push("/login");

            return;
          }

          const refUsuario = doc(
            db,
            "usuarios",
            user.uid
          );

          const snapUsuario =
            await getDoc(refUsuario);

          if (!snapUsuario.exists()) {
            await signOut(auth);

            router.push("/login");

            return;
          }

          const data =
            snapUsuario.data() as UsuarioSistema;

          if (data.activo === false) {
            await signOut(auth);

            router.push("/login");

            return;
          }

          setUsuario(data);

          setCargando(false);
        }
      );

    return () => unsubscribe();
  }, [router]);

  const links = useMemo(() => {
    if (!usuario) return [];

    if (usuario.rol === "admin") {
      return linksBase;
    }

    return linksBase.filter((link) => {
      if (link.permiso === "dashboard")
        return true;

      return Boolean(
        usuario.permisos?.[
          link.permiso as keyof Permisos
        ]
      );
    });
  }, [usuario]);

  async function cerrarSesion() {
    await signOut(auth);

    router.push("/login");
  }

  if (cargando) {
    return (
      <aside className="hidden h-screen w-72 border-r border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950 md:block">
        <div className="h-14 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />

        <div className="mt-10 space-y-3">
          <div className="h-11 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />

          <div className="h-11 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />

          <div className="h-11 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      </aside>
    );
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="
          fixed left-4 top-4 z-50 rounded-2xl
          border border-slate-200
          bg-white p-3 shadow-lg

          dark:border-slate-700
          dark:bg-slate-900

          md:hidden
        "
      >
        <Menu
          size={22}
          className="dark:text-white"
        />
      </button>

      {abierto && (
        <div
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-72 flex-col
          border-r border-slate-200
          bg-white
          transition-transform duration-300

          dark:border-slate-800
          dark:bg-slate-950

          ${
            abierto
              ? "translate-x-0"
              : "-translate-x-full"
          }

          md:translate-x-0
        `}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src="/logo-cnb.png"
              alt="CNB"
              className="h-12 w-12 rounded-2xl object-cover"
            />

            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                CNB Conecta+
              </h1>

              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Comunicaciones
              </p>
            </div>
          </div>

          <button
            onClick={() => setAbierto(false)}
            className="md:hidden"
          >
            <X
              size={22}
              className="dark:text-white"
            />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <nav className="space-y-2">
            {links.map((link) => {
              const activo =
                pathname === link.href;

              const Icono = link.icono;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() =>
                    setAbierto(false)
                  }
                  className={`
                    group flex items-center gap-3 rounded-2xl px-4 py-3
                    text-sm font-semibold transition-all

                    ${
                      activo
                        ? `
                          bg-[#44D7A8]
                          text-white
                          shadow-lg shadow-emerald-500/20
                        `
                        : `
                          text-slate-600
                          hover:bg-slate-100

                          dark:text-slate-300
                          dark:hover:bg-slate-800
                        `
                    }
                  `}
                >
                  <Icono size={19} />

                  {link.nombre}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <button
            onClick={cerrarSesion}
            className="
              flex w-full items-center gap-3
              rounded-2xl px-4 py-3
              text-sm font-semibold
              text-red-600
              transition
              hover:bg-red-50

              dark:hover:bg-red-950/30
            "
          >
            <LogOut size={18} />

            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}