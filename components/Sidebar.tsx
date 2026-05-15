"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Sidebar() {
  const [abierto, setAbierto] = useState(false);

  const links = [
    { nombre: "Dashboard", href: "/" },
    { nombre: "Iglesias", href: "/iglesias" },
    { nombre: "Ministerios", href: "/ministerios" },
    { nombre: "Directorio", href: "/directorio" },
    { nombre: "Anuncios", href: "/anuncios" },
    { nombre: "Envíos", href: "/envios" },
    { nombre: "Historial de Envíos", href: "/historial-envios" },
    { nombre: "Evidencias", href: "/evidencias" },
  ];

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-white p-3 rounded-xl shadow"
      >
        <Menu size={24} />
      </button>

      {abierto && (
        <div
          onClick={() => setAbierto(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      <aside
        className={`
          fixed md:static top-0 left-0 z-50 h-full w-64 bg-white shadow-xl p-6
          transform transition-transform duration-300
          ${abierto ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold text-[#44D7A8]">
            CNB Conecta+
          </h2>

          <button
            onClick={() => setAbierto(false)}
            className="md:hidden"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="space-y-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setAbierto(false)}
              className="w-full block p-3 rounded-xl hover:bg-[#44D7A8] hover:text-white transition font-medium"
            >
              {link.nombre}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}