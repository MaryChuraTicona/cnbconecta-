"use client";

import { useEffect, useMemo, useState } from "react";
import ProtegerRuta from "@/components/ProtegerRuta";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

interface Usuario {
  uid?: string;
  nombre?: string;
  rol?: string;
}

interface ActividadPOA {
  id: string;
  titulo: string;
  descripcion?: string;
  responsable?: string;
  fecha: string;
  mes: string;
  estado: "pendiente" | "proceso" | "cumplido";
  prioridad: "normal" | "alta";
}

export default function PoaPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [actividades, setActividades] = useState<ActividadPOA[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [formulario, setFormulario] = useState({
    titulo: "",
    descripcion: "",
    responsable: "",
    fecha: "",
    estado: "pendiente",
    prioridad: "normal",
  });

  const puedeGestionar =
    usuario?.rol === "admin" || usuario?.rol === "comunicador_distrital";

  async function cargarDatos() {
    const snapshot = await getDocs(collection(db, "poa"));

    setActividades(
      snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ActividadPOA[]
    );
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const snapUsuario = await getDoc(doc(db, "usuarios", user.uid));

      if (snapUsuario.exists()) {
        setUsuario({
          uid: user.uid,
          ...snapUsuario.data(),
        } as Usuario);
      }

      cargarDatos();
    });

    return () => unsubscribe();
  }, []);

  async function guardarActividad() {
    if (!formulario.titulo.trim() || !formulario.fecha) {
      alert("Completa el título y la fecha");
      return;
    }

    const mes = formulario.fecha.slice(0, 7);

    if (editandoId) {
      await updateDoc(doc(db, "poa", editandoId), {
        ...formulario,
        mes,
        actualizadoEn: new Date(),
      });

      setEditandoId(null);
    } else {
      await addDoc(collection(db, "poa"), {
        ...formulario,
        mes,
        creadoPorUid: usuario?.uid || null,
        creadoPorNombre: usuario?.nombre || "Usuario",
        creadoEn: new Date(),
      });
    }

    setFormulario({
      titulo: "",
      descripcion: "",
      responsable: "",
      fecha: "",
      estado: "pendiente",
      prioridad: "normal",
    });

    cargarDatos();
  }

  function editarActividad(actividad: ActividadPOA) {
    setEditandoId(actividad.id);

    setFormulario({
      titulo: actividad.titulo,
      descripcion: actividad.descripcion || "",
      responsable: actividad.responsable || "",
      fecha: actividad.fecha,
      estado: actividad.estado,
      prioridad: actividad.prioridad,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function cambiarEstado(id: string, estado: ActividadPOA["estado"]) {
    await updateDoc(doc(db, "poa", id), {
      estado,
      actualizadoEn: new Date(),
    });

    cargarDatos();
  }

  async function eliminarActividad(id: string) {
    const confirmar = confirm("¿Eliminar esta actividad del POA?");

    if (!confirmar) return;

    await deleteDoc(doc(db, "poa", id));
    cargarDatos();
  }

  const actividadesFiltradas = useMemo(() => {
    return actividades.filter((a) =>
      `${a.titulo} ${a.descripcion} ${a.responsable} ${a.estado}`
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    );
  }, [actividades, busqueda]);

  const totalCumplidas = actividades.filter((a) => a.estado === "cumplido").length;
  const totalPendientes = actividades.filter((a) => a.estado === "pendiente").length;
  const avance =
    actividades.length > 0
      ? Math.round((totalCumplidas / actividades.length) * 100)
      : 0;

  return (
    <ProtegerRuta permiso="poa">
      <div className="space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="text-sm font-semibold text-[#2FAF86]">
                Área de Comunicaciones
              </span>

              <h1 className="mt-2 text-3xl font-black text-slate-900 md:text-4xl">
                POA Comunicaciones
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Planifica actividades, campañas, publicaciones y acciones del
                área de comunicaciones durante el año.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MiniCard titulo="Actividades" valor={actividades.length} />
              <MiniCard titulo="Pendientes" valor={totalPendientes} />
              <MiniCard titulo="Avance" valor={`${avance}%`} />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[390px_1fr]">
          {puedeGestionar && (
            <Panel
              titulo={editandoId ? "Editar actividad" : "Nueva actividad"}
              subtitulo="Agrega acciones al plan operativo"
            >
              <div className="space-y-4">
                <Input
                  label="Actividad"
                  placeholder="Ej. Campaña CALEB"
                  value={formulario.titulo}
                  onChange={(v: string) =>
                    setFormulario({ ...formulario, titulo: v })
                  }
                />

                <Input
                  label="Responsable"
                  placeholder="Ej. Coordinador de comunicaciones"
                  value={formulario.responsable}
                  onChange={(v: string) =>
                    setFormulario({ ...formulario, responsable: v })
                  }
                />

                <Input
                  label="Fecha"
                  type="date"
                  value={formulario.fecha}
                  onChange={(v: string) =>
                    setFormulario({ ...formulario, fecha: v })
                  }
                />

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Estado
                  </label>

                  <select
                    value={formulario.estado}
                    onChange={(e) =>
                      setFormulario({
                        ...formulario,
                        estado: e.target.value,
                      })
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-[#44D7A8]"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="proceso">En proceso</option>
                    <option value="cumplido">Cumplido</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Prioridad
                  </label>

                  <select
                    value={formulario.prioridad}
                    onChange={(e) =>
                      setFormulario({
                        ...formulario,
                        prioridad: e.target.value,
                      })
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-[#44D7A8]"
                  >
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Descripción
                  </label>

                  <textarea
                    rows={4}
                    value={formulario.descripcion}
                    onChange={(e) =>
                      setFormulario({
                        ...formulario,
                        descripcion: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-slate-200 p-4 text-sm outline-none focus:border-[#44D7A8]"
                    placeholder="Detalle de la actividad..."
                  />
                </div>

                <button
                  onClick={guardarActividad}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#059669] text-sm font-bold text-white transition hover:bg-[#047857]"
                >
                  <Plus size={17} />
                  {editandoId ? "Actualizar actividad" : "Guardar actividad"}
                </button>
              </div>
            </Panel>
          )}

          <Panel
            titulo="Plan de actividades"
            subtitulo="Seguimiento general del POA"
            className={!puedeGestionar ? "xl:col-span-2" : ""}
          >
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:w-[340px]">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar actividad..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-[#44D7A8]"
                />
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 md:w-52">
                <div
                  className="h-full rounded-full bg-[#059669]"
                  style={{ width: `${avance}%` }}
                />
              </div>
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Actividad</th>
                    <th className="px-4 py-3">Responsable</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Prioridad</th>
                    {puedeGestionar && (
                      <th className="px-4 py-3 text-right">Acciones</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {actividadesFiltradas.map((a) => (
                    <tr key={a.id} className="border-t border-slate-100">
                      <td className="px-4 py-4">
                        <p className="font-black text-slate-900">{a.titulo}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                          {a.descripcion || "Sin descripción"}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {a.responsable || "—"}
                      </td>

                      <td className="px-4 py-4 text-slate-600">{a.fecha}</td>

                      <td className="px-4 py-4">
                        <EstadoBadge estado={a.estado} />
                      </td>

                      <td className="px-4 py-4">
                        <PrioridadBadge prioridad={a.prioridad} />
                      </td>

                      {puedeGestionar && (
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => cambiarEstado(a.id, "cumplido")}
                              className="rounded-xl bg-green-100 p-2 text-green-700"
                            >
                              <CheckCircle2 size={17} />
                            </button>

                            <button
                              onClick={() => cambiarEstado(a.id, "proceso")}
                              className="rounded-xl bg-yellow-100 p-2 text-yellow-700"
                            >
                              <Clock size={17} />
                            </button>

                            <button
                              onClick={() => editarActividad(a)}
                              className="rounded-xl bg-slate-100 p-2 text-slate-600"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              onClick={() => eliminarActividad(a.id)}
                              className="rounded-xl bg-red-50 p-2 text-red-600"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:hidden">
              {actividadesFiltradas.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-slate-900">{a.titulo}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {a.descripcion || "Sin descripción"}
                      </p>
                    </div>

                    <PrioridadBadge prioridad={a.prioridad} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <EstadoBadge estado={a.estado} />

                    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      <CalendarDays size={14} />
                      {a.fecha}
                    </span>
                  </div>

                  {puedeGestionar && (
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      <button
                        onClick={() => cambiarEstado(a.id, "cumplido")}
                        className="rounded-xl bg-green-100 py-2 text-green-700"
                      >
                        ✓
                      </button>

                      <button
                        onClick={() => cambiarEstado(a.id, "proceso")}
                        className="rounded-xl bg-yellow-100 py-2 text-yellow-700"
                      >
                        …
                      </button>

                      <button
                        onClick={() => editarActividad(a)}
                        className="rounded-xl bg-slate-100 py-2 text-slate-600"
                      >
                        ✎
                      </button>

                      <button
                        onClick={() => eliminarActividad(a.id)}
                        className="rounded-xl bg-red-50 py-2 text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </section>
      </div>
    </ProtegerRuta>
  );
}

function Panel({ titulo, subtitulo, children, className = "" }: any) {
  return (
    <section
      className={`rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6 ${className}`}
    >
      <div className="mb-5">
        <h2 className="text-xl font-black text-slate-900">{titulo}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>
      </div>

      {children}
    </section>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "" }: any) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-[#44D7A8]"
      />
    </div>
  );
}

function MiniCard({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-2xl font-black text-slate-900">{valor}</p>
      <p className="text-xs font-bold text-slate-500">{titulo}</p>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    pendiente: "bg-slate-100 text-slate-600",
    proceso: "bg-yellow-100 text-yellow-700",
    cumplido: "bg-green-100 text-green-700",
  };

  const texto: Record<string, string> = {
    pendiente: "Pendiente",
    proceso: "En proceso",
    cumplido: "Cumplido",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        estilos[estado] || "bg-slate-100 text-slate-600"
      }`}
    >
      {texto[estado] || estado}
    </span>
  );
}

function PrioridadBadge({ prioridad }: { prioridad: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        prioridad === "alta"
          ? "bg-red-100 text-red-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {prioridad === "alta" ? "Alta" : "Normal"}
    </span>
  );
}