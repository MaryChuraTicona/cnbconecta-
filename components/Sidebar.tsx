"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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
import { auth, db } from "@/lib/firebase";

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
  reportes?: boolean;
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

  const [abierto, setAbierto] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioSistema | null>(null);
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

      const data = snapUsuario.data() as UsuarioSistema;

      if (data.activo === false) {
        await signOut(auth);
        router.push("/login");
        return;
      }

      setUsuario(data);
      setCargando(false);
    });

    return () => unsubscribe();
  }, [router]);

  const links = useMemo(() => {
    if (!usuario) return [];

    if (usuario.rol === "admin") {
      return linksBase;
    }

    return linksBase.filter((link) => {
      if (link.permiso === "dashboard") return true;

      return Boolean(
        usuario.permisos?.[link.permiso as keyof Permisos]
      );
    });
  }, [usuario]);

  async function cerrarSesion() {
    await signOut(auth);
    router.push("/login");
  }

  if (cargando) {
    return (
      <aside className="hidden h-screen w-72 border-r border-slate-200 bg-white p-6 md:block">
        <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
        <div className="mt-10 space-y-3">
          <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </aside>
    );
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="fixed left-4 top-4 z-50 rounded-xl bg-white p-3 shadow md:hidden"
      >
        <Menu size={24} />
      </button>

      {abierto && (
        <div
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-slate-200 bg-white p-5 shadow-xl
          transition-transform duration-300
          ${abierto ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:shadow-none
        `}
      >
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo-cnb.png"
              alt="CNB Conecta"
              className="h-12 w-12 rounded-2xl object-cover"
            />

            <div>
              <h1 className="text-lg font-black text-[#111827]">
                CNB Conecta+
              </h1>

              <p className="text-xs font-medium text-slate-500">
                Comunicaciones CNB
              </p>
            </div>
          </Link>

          <button onClick={() => setAbierto(false)} className="md:hidden">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {links.map((link) => {
            const Icono = link.icono;
            const activo =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setAbierto(false)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  activo
                    ? "bg-[#44D7A8] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icono size={19} />
                {link.nombre}
              </Link>
            );
          })}
        </nav>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <p className="truncate text-sm font-black text-slate-900">
            {usuario?.nombre || "Usuario"}
          </p>

          <p className="mt-1 text-xs font-medium text-slate-500">
            {formatearRol(usuario?.rol || "usuario")}
          </p>

          <button
            onClick={cerrarSesion}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={17} />
            Salir
          </button>
        </div>
      </aside>
    </>
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