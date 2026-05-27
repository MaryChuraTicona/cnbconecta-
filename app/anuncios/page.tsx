"use client";

import { useEffect, useState } from "react";
import ProtegerRuta from "@/components/ProtegerRuta";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, doc, getDoc, getDocs } from "firebase/firestore";
import { ImagePlus, Megaphone, Plus, Send } from "lucide-react";

interface Usuario {
  uid?: string;
  nombre?: string;
  rol?: string;
  iglesiaId?: string | null;
  iglesiaNombre?: string;
}

interface Iglesia {
  id: string;
  nombre: string;
}

interface Ministerio {
  id: string;
  nombre: string;
}

export default function AnunciosPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [iglesias, setIglesias] = useState<Iglesia[]>([]);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [formulario, setFormulario] = useState({
    titulo: "",
    resumen: "",
    contenido: "",
    lugar: "",
    fecha: "",
    hora: "",
    prioridad: "normal",
    destinatarioTipo: "todos",
    iglesiaId: "",
    iglesiaNombre: "",
    ministerioId: "",
    ministerioNombre: "",
    imagenUrl: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const ref = doc(db, "usuarios", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data() as Usuario;

        setUsuario({
          uid: user.uid,
          ...data,
        });

        if (data.rol === "comunicador_iglesia") {
          setFormulario((prev) => ({
            ...prev,
            destinatarioTipo: "iglesia",
            iglesiaId: data.iglesiaId || "",
            iglesiaNombre: data.iglesiaNombre || "",
          }));
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function cargarDatos() {
      const iglesiasSnap = await getDocs(collection(db, "churches"));
      const ministeriosSnap = await getDocs(collection(db, "ministries"));

      setIglesias(
        iglesiasSnap.docs.map((docu) => ({
          id: docu.id,
          nombre: docu.data().nombre,
        }))
      );

      setMinisterios(
        ministeriosSnap.docs.map((docu) => ({
          id: docu.id,
          nombre: docu.data().nombre,
        }))
      );
    }

    cargarDatos();
  }, []);

  async function subirImagen(archivo: File) {
    try {
      setSubiendo(true);

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      const data = new FormData();
      data.append("file", archivo);
      data.append("upload_preset", uploadPreset || "");

      const respuesta = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: data,
        }
      );

      const resultado = await respuesta.json();

      if (!resultado.secure_url) {
        alert("No se pudo subir la imagen");
        return;
      }

      setFormulario((prev) => ({
        ...prev,
        imagenUrl: resultado.secure_url,
      }));
    } catch (error) {
      console.error(error);
      alert("Error al subir imagen");
    } finally {
      setSubiendo(false);
    }
  }

  async function guardarAnuncio() {
    if (!formulario.titulo.trim()) {
      alert("Escribe el título del anuncio");
      return;
    }

    if (!formulario.contenido.trim()) {
      alert("Escribe el contenido del anuncio");
      return;
    }

    if (!formulario.imagenUrl) {
      alert("Sube una imagen para el anuncio");
      return;
    }

    try {
      setGuardando(true);

      await addDoc(collection(db, "announcements"), {
        ...formulario,
        estado: "pendiente",
        creadoPorUid: usuario?.uid || null,
        creadoPorNombre: usuario?.nombre || "Usuario",
        creadoPorRol: usuario?.rol || "usuario",
        iglesiaCreadorId: usuario?.iglesiaId || null,
        iglesiaCreadorNombre: usuario?.iglesiaNombre || "Distrito CNB",
        creadoEn: new Date(),
        aprobadoPor: null,
        aprobadoEn: null,
        rechazadoPor: null,
        rechazadoEn: null,
      });

      alert("Anuncio enviado para aprobación");

      setFormulario({
        titulo: "",
        resumen: "",
        contenido: "",
        lugar: "",
        fecha: "",
        hora: "",
        prioridad: "normal",
        destinatarioTipo:
          usuario?.rol === "comunicador_iglesia" ? "iglesia" : "todos",
        iglesiaId: usuario?.rol === "comunicador_iglesia" ? usuario?.iglesiaId || "" : "",
        iglesiaNombre:
          usuario?.rol === "comunicador_iglesia" ? usuario?.iglesiaNombre || "" : "",
        ministerioId: "",
        ministerioNombre: "",
        imagenUrl: "",
      });
    } catch (error) {
      console.error(error);
      alert("Error al guardar anuncio");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ProtegerRuta permiso="anuncios">
      <div className="space-y-8">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <span className="text-sm font-semibold text-[#2FAF86]">
            Área de Comunicaciones
          </span>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            Crear Anuncio
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 md:text-base">
            Crea comunicados oficiales para revisión. El pastor distrital o el
            administrador podrán aprobarlos antes de su publicación.
          </p>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-[#44D7A8]/10 p-3 text-[#2FAF86]">
              <Megaphone size={22} />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Nuevo anuncio
              </h2>
              <p className="text-sm text-slate-500">
                Será enviado como pendiente de aprobación
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Título"
              value={formulario.titulo}
              onChange={(v: string) =>
                setFormulario({ ...formulario, titulo: v })
              }
            />

            <Input
              label="Resumen"
              value={formulario.resumen}
              onChange={(v: string) =>
                setFormulario({ ...formulario, resumen: v })
              }
            />

            <Input
              label="Lugar"
              value={formulario.lugar}
              onChange={(v: string) =>
                setFormulario({ ...formulario, lugar: v })
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

            <Input
              label="Hora"
              type="time"
              value={formulario.hora}
              onChange={(v: string) =>
                setFormulario({ ...formulario, hora: v })
              }
            />

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Prioridad
              </label>
              <select
                value={formulario.prioridad}
                onChange={(e) =>
                  setFormulario({ ...formulario, prioridad: e.target.value })
                }
                className="h-14 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-[#44D7A8]"
              >
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Mensaje del anuncio
            </label>
            <textarea
              value={formulario.contenido}
              onChange={(e) =>
                setFormulario({ ...formulario, contenido: e.target.value })
              }
              rows={6}
              className="w-full rounded-2xl border border-slate-200 p-4 text-sm outline-none focus:border-[#44D7A8]"
              placeholder="Escribe aquí el mensaje oficial..."
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Destinatario
              </label>

              <select
                value={formulario.destinatarioTipo}
                disabled={usuario?.rol === "comunicador_iglesia"}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    destinatarioTipo: e.target.value,
                    iglesiaId: "",
                    iglesiaNombre: "",
                    ministerioId: "",
                    ministerioNombre: "",
                  })
                }
                className="h-14 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-[#44D7A8] disabled:bg-slate-100"
              >
                <option value="todos">Todo el distrito</option>
                <option value="iglesia">Una iglesia</option>
                <option value="ministerio">Un ministerio</option>
              </select>
            </div>

            {formulario.destinatarioTipo === "iglesia" && (
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Iglesia
                </label>

                <select
                  value={formulario.iglesiaId}
                  disabled={usuario?.rol === "comunicador_iglesia"}
                  onChange={(e) => {
                    const iglesia = iglesias.find((i) => i.id === e.target.value);

                    setFormulario({
                      ...formulario,
                      iglesiaId: e.target.value,
                      iglesiaNombre: iglesia?.nombre || "",
                    });
                  }}
                  className="h-14 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-[#44D7A8] disabled:bg-slate-100"
                >
                  <option value="">Seleccionar iglesia</option>
                  {iglesias.map((iglesia) => (
                    <option key={iglesia.id} value={iglesia.id}>
                      {iglesia.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formulario.destinatarioTipo === "ministerio" && (
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Ministerio
                </label>

                <select
                  value={formulario.ministerioId}
                  onChange={(e) => {
                    const ministerio = ministerios.find(
                      (m) => m.id === e.target.value
                    );

                    setFormulario({
                      ...formulario,
                      ministerioId: e.target.value,
                      ministerioNombre: ministerio?.nombre || "",
                    });
                  }}
                  className="h-14 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-[#44D7A8]"
                >
                  <option value="">Seleccionar ministerio</option>
                  {ministerios.map((ministerio) => (
                    <option key={ministerio.id} value={ministerio.id}>
                      {ministerio.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 text-center">
              <ImagePlus className="text-[#2FAF86]" size={32} />

              <span className="text-sm font-bold text-slate-700">
                {subiendo ? "Subiendo imagen..." : "Subir imagen del anuncio"}
              </span>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const archivo = e.target.files?.[0];
                  if (archivo) subirImagen(archivo);
                }}
              />
            </label>

            {formulario.imagenUrl && (
              <img
                src={formulario.imagenUrl}
                alt="Imagen del anuncio"
                className="mt-5 max-h-72 w-full rounded-2xl object-cover"
              />
            )}
          </div>

          <button
            onClick={guardarAnuncio}
            disabled={guardando || subiendo}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#111827] px-6 py-4 text-sm font-bold text-white transition hover:bg-black disabled:opacity-50"
          >
            <Send size={18} />
            {guardando ? "Enviando..." : "Enviar para aprobación"}
          </button>
        </section>
      </div>
    </ProtegerRuta>
  );
}

function Input({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-14 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-[#44D7A8]"
      />
    </div>
  );
}