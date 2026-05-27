"use client";

import { useEffect, useState } from "react";
import ProtegerRuta from "@/components/ProtegerRuta";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  CheckCircle2,
  Clock,
  FileCheck2,
  ImageIcon,
  Search,
  XCircle,
} from "lucide-react";

interface Usuario {
  uid?: string;
  nombre?: string;
  rol?: string;
}

interface Anuncio {
  id: string;
  titulo: string;
  resumen?: string;
  contenido: string;
  lugar?: string;
  fecha?: string;
  hora?: string;
  prioridad?: string;
  destinatarioTipo?: string;
  iglesiaNombre?: string;
  ministerioNombre?: string;
  imagenUrl?: string;
  estado: "pendiente" | "aprobado" | "rechazado";
  creadoPorNombre?: string;
  iglesiaCreadorNombre?: string;
}

export default function AprobacionesPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  async function cargarAnuncios() {
    try {
      setCargando(true);

      const q = query(
  collection(db, "announcements"),
  where("estado", "==", "pendiente")
);

const snapshot = await getDocs(q);

      const lista = snapshot.docs.map((docu) => ({
        id: docu.id,
        ...docu.data(),
      })) as Anuncio[];

      setAnuncios(lista);
    } catch (error) {
      console.error(error);
      alert("Error cargando anuncios pendientes");
    } finally {
      setCargando(false);
    }
  }

  async function aprobarAnuncio(id: string) {
    const confirmar = confirm("¿Aprobar este anuncio?");

    if (!confirmar) return;

    try {
      await updateDoc(doc(db, "announcements", id), {
        estado: "aprobado",
        aprobadoPorUid: usuario?.uid || null,
        aprobadoPorNombre: usuario?.nombre || "Usuario",
        aprobadoPorRol: usuario?.rol || "usuario",
        aprobadoEn: new Date(),
      });

      cargarAnuncios();
    } catch (error) {
      console.error(error);
      alert("Error aprobando anuncio");
    }
  }

  async function rechazarAnuncio(id: string) {
    const motivo = prompt("Motivo del rechazo:");

    if (!motivo) return;

    try {
      await updateDoc(doc(db, "announcements", id), {
        estado: "rechazado",
        motivoRechazo: motivo,
        rechazadoPorUid: usuario?.uid || null,
        rechazadoPorNombre: usuario?.nombre || "Usuario",
        rechazadoPorRol: usuario?.rol || "usuario",
        rechazadoEn: new Date(),
      });

      cargarAnuncios();
    } catch (error) {
      console.error(error);
      alert("Error rechazando anuncio");
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const refUsuario = doc(db, "usuarios", user.uid);
      const snapUsuario = await getDoc(refUsuario);

      if (snapUsuario.exists()) {
        setUsuario({
          uid: user.uid,
          ...snapUsuario.data(),
        });
      }
    });

    cargarAnuncios();

    return () => unsubscribe();
  }, []);

  const anunciosFiltrados = anuncios.filter((anuncio) =>
    `${anuncio.titulo} ${anuncio.resumen} ${anuncio.contenido} ${anuncio.creadoPorNombre}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  return (
    <ProtegerRuta permiso="aprobarAnuncios">
      <div className="space-y-8">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="text-sm font-semibold text-[#2FAF86]">
                Área de Comunicaciones
              </span>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                Aprobación de Anuncios
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 md:text-base">
                Revisa, aprueba o rechaza los anuncios enviados por los
                comunicadores antes de su publicación oficial.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5">
              <div className="flex items-center justify-between gap-8">
                <Clock className="text-slate-500" size={22} />
                <p className="text-3xl font-black text-slate-900">
                  {anuncios.length}
                </p>
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-600">
                Pendientes
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#44D7A8]/10 p-3 text-[#2FAF86]">
                <FileCheck2 size={22} />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  Anuncios pendientes
                </h2>
                <p className="text-sm text-slate-500">
                  Solo admin y pastor distrital pueden aprobar
                </p>
              </div>
            </div>

            <div className="relative w-full lg:w-[340px]">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Buscar anuncio..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-[#44D7A8]"
              />
            </div>
          </div>

          {cargando ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
              Cargando anuncios...
            </div>
          ) : anunciosFiltrados.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm font-medium text-slate-500">
              No hay anuncios pendientes
            </div>
          ) : (
            <div className="space-y-5">
              {anunciosFiltrados.map((anuncio) => (
                <div
                  key={anuncio.id}
                  className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/60 transition hover:border-[#44D7A8]/40 hover:bg-white hover:shadow-sm"
                >
                  {anuncio.imagenUrl ? (
                    <img
                      src={anuncio.imagenUrl}
                      alt={anuncio.titulo}
                      className="h-64 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-52 items-center justify-center bg-slate-100 text-slate-400">
                      <ImageIcon size={42} />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <Badge texto="Pendiente" color="yellow" />
                      <Badge texto={anuncio.prioridad || "normal"} />
                      <Badge texto={anuncio.iglesiaCreadorNombre || "Distrito CNB"} />
                    </div>

                    <h3 className="text-xl font-black text-slate-900">
                      {anuncio.titulo}
                    </h3>

                    {anuncio.resumen && (
                      <p className="mt-2 text-sm font-medium text-slate-600">
                        {anuncio.resumen}
                      </p>
                    )}

                    <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {anuncio.contenido}
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                      <Info label="Creado por" value={anuncio.creadoPorNombre} />
                      <Info label="Destino" value={obtenerDestino(anuncio)} />
                      <Info
                        label="Fecha"
                        value={
                          anuncio.fecha
                            ? `${anuncio.fecha} ${anuncio.hora || ""}`
                            : "Sin fecha"
                        }
                      />
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button
                        onClick={() => rechazarAnuncio(anuncio.id)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
                      >
                        <XCircle size={18} />
                        Rechazar
                      </button>

                      <button
                        onClick={() => aprobarAnuncio(anuncio.id)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-[#16a36a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#128458]"
                      >
                        <CheckCircle2 size={18} />
                        Aprobar anuncio
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </ProtegerRuta>
  );
}

function obtenerDestino(anuncio: Anuncio) {
  if (anuncio.destinatarioTipo === "iglesia") {
    return anuncio.iglesiaNombre || "Iglesia";
  }

  if (anuncio.destinatarioTipo === "ministerio") {
    return anuncio.ministerioNombre || "Ministerio";
  }

  return "Todo el distrito";
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-700">{value || "—"}</p>
    </div>
  );
}

function Badge({
  texto,
  color,
}: {
  texto: string;
  color?: "yellow";
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        color === "yellow"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-white text-slate-600"
      }`}
    >
      {texto}
    </span>
  );
}