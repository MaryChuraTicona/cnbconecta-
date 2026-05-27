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
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Check, Download, ImagePlus, Trash2, X } from "lucide-react";

interface Usuario {
  uid?: string;
  nombre?: string;
  rol?: string;
  iglesiaId?: string;
  iglesiaNombre?: string;
}

interface Campania {
  id: string;
  titulo: string;
  descripcion?: string;
  fechaLimite: string;
  activa: boolean;
}

interface Evidencia {
  id: string;
  campaignId: string;
  campaignTitulo: string;
  iglesiaId?: string;
  iglesiaNombre: string;
  descripcion?: string;
  imagenUrl: string;
  estado: "enviada" | "seleccionada" | "descartada";
  seleccionadoParaRedes: boolean;
  subidoPorNombre: string;
}

export default function EvidenciasPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [campanias, setCampanias] = useState<Campania[]>([]);
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [campaniaFiltro, setCampaniaFiltro] = useState("");

  const [campaniaForm, setCampaniaForm] = useState({
    titulo: "",
    descripcion: "",
    fechaLimite: "",
  });

  const [evidenciaForm, setEvidenciaForm] = useState({
    campaignId: "",
    descripcion: "",
    imagenes: [] as string[],
  });

  const puedeGestionar =
    usuario?.rol === "admin" ||
    usuario?.rol === "comunicador_distrital" ||
    usuario?.rol === "pastor_distrital";

  const hoy = new Date().toISOString().slice(0, 10);

  const campaniasActivas = useMemo(
    () => campanias.filter((c) => c.activa && c.fechaLimite >= hoy),
    [campanias, hoy]
  );

  const evidenciasVisibles = puedeGestionar
    ? evidencias
    : evidencias.filter((e) => e.iglesiaId === usuario?.iglesiaId);

  const evidenciasFiltradasPorCampania = campaniaFiltro
    ? evidenciasVisibles.filter((e) => e.campaignId === campaniaFiltro)
    : evidenciasVisibles;

  const seleccionadasFiltradas = evidenciasFiltradasPorCampania.filter(
    (e) => e.estado === "seleccionada"
  );

  const seleccionadasTotales = evidencias.filter(
    (e) => e.estado === "seleccionada"
  );

  async function cargarDatos() {
    const campaniasSnap = await getDocs(collection(db, "evidenceCampaigns"));
    const evidenciasSnap = await getDocs(collection(db, "evidences"));

    setCampanias(
      campaniasSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Campania[]
    );

    setEvidencias(
      evidenciasSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Evidencia[]
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

      await cargarDatos();
    });

    return () => unsubscribe();
  }, []);

  async function crearCampania() {
    if (!campaniaForm.titulo.trim() || !campaniaForm.fechaLimite) {
      alert("Completa el nombre de la actividad y la fecha límite");
      return;
    }

    await addDoc(collection(db, "evidenceCampaigns"), {
      ...campaniaForm,
      activa: true,
      creadoPorUid: usuario?.uid || null,
      creadoPorNombre: usuario?.nombre || "Usuario",
      creadoEn: new Date(),
    });

    setCampaniaForm({
      titulo: "",
      descripcion: "",
      fechaLimite: "",
    });

    cargarDatos();
  }

  async function subirImagen(archivos: FileList) {
    try {
      const archivosArray = Array.from(archivos);

      if (archivosArray.length > 5) {
        alert("Puedes subir máximo 5 fotos");
        return;
      }

      setSubiendo(true);

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      const urls: string[] = [];

      for (const archivo of archivosArray) {
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

        if (resultado.secure_url) {
          urls.push(resultado.secure_url);
        }
      }

      setEvidenciaForm((prev) => ({
        ...prev,
        imagenes: urls,
      }));
    } catch (error) {
      console.error(error);
      alert("Error subiendo imágenes");
    } finally {
      setSubiendo(false);
    }
  }

  async function subirEvidencia() {
    if (!evidenciaForm.campaignId) {
      alert("Selecciona una actividad");
      return;
    }

    if (evidenciaForm.imagenes.length === 0) {
      alert("Sube mínimo una foto");
      return;
    }

    const campania = campanias.find((c) => c.id === evidenciaForm.campaignId);

    if (!campania) return;

    for (const imagenUrl of evidenciaForm.imagenes) {
      await addDoc(collection(db, "evidences"), {
        campaignId: campania.id,
        campaignTitulo: campania.titulo,
        iglesiaId: usuario?.iglesiaId || null,
        iglesiaNombre: usuario?.iglesiaNombre || "Distrito CNB",
        descripcion: evidenciaForm.descripcion,
        imagenUrl,
        estado: "enviada",
        seleccionadoParaRedes: false,
        subidoPorUid: usuario?.uid || null,
        subidoPorNombre: usuario?.nombre || "Usuario",
        subidoPorRol: usuario?.rol || "usuario",
        creadoEn: new Date(),
      });
    }

    setEvidenciaForm({
      campaignId: "",
      descripcion: "",
      imagenes: [],
    });

    alert("Fotos enviadas correctamente");
    cargarDatos();
  }

  async function seleccionarFoto(evidencia: Evidencia) {
    await updateDoc(doc(db, "evidences", evidencia.id), {
      estado: "seleccionada",
      seleccionadoParaRedes: true,
      seleccionadoPorUid: usuario?.uid || null,
      seleccionadoPorNombre: usuario?.nombre || "Usuario",
      seleccionadoEn: new Date(),
    });

    cargarDatos();
  }

  async function descartarFoto(evidencia: Evidencia) {
    await updateDoc(doc(db, "evidences", evidencia.id), {
      estado: "descartada",
      seleccionadoParaRedes: false,
    });

    cargarDatos();
  }

  async function eliminarFoto(evidencia: Evidencia) {
    const confirmar = confirm(
      "¿Eliminar esta evidencia? Esto la quitará del sistema."
    );

    if (!confirmar) return;

    await deleteDoc(doc(db, "evidences", evidencia.id));
    cargarDatos();
  }

  async function descargarSeleccionadas(campaignId?: string) {
    try {
      const fotosSeleccionadas = evidencias.filter((e) => {
        const esSeleccionada = e.estado === "seleccionada";
        const esCampania = campaignId ? e.campaignId === campaignId : true;

        return esSeleccionada && esCampania;
      });

      if (fotosSeleccionadas.length === 0) {
        alert("No hay fotos seleccionadas para esta campaña");
        return;
      }

      setDescargando(true);

      const zip = new JSZip();

      for (let i = 0; i < fotosSeleccionadas.length; i++) {
        const evidencia = fotosSeleccionadas[i];

        const response = await fetch(evidencia.imagenUrl);
        const blob = await response.blob();

        const nombreLimpio =
          `${evidencia.campaignTitulo}-${evidencia.iglesiaNombre}-${i + 1}`
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .toLowerCase();

        zip.file(`${nombreLimpio}.jpg`, blob);
      }

      const contenido = await zip.generateAsync({
        type: "blob",
      });

      const nombreZip =
        fotosSeleccionadas[0]?.campaignTitulo
          ?.replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .toLowerCase() || "evidencias";

      saveAs(contenido, `${nombreZip}-seleccionadas.zip`);
    } catch (error) {
      console.error(error);
      alert("Error descargando imágenes");
    } finally {
      setDescargando(false);
    }
  }

  async function cambiarEstadoCampania(campania: Campania) {
    await updateDoc(doc(db, "evidenceCampaigns", campania.id), {
      activa: !campania.activa,
    });

    cargarDatos();
  }

  return (
    <ProtegerRuta permiso="evidencias">
      <div className="space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="text-sm font-semibold text-[#2FAF86]">
                Área de Comunicaciones
              </span>

              <h1 className="mt-2 text-3xl font-black text-slate-900 md:text-4xl">
                Evidencias
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Gestiona actividades habilitadas y selecciona las mejores fotos
                para redes oficiales del distrito.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MiniCard titulo="Activas" valor={campaniasActivas.length} />
              <MiniCard titulo="Recibidas" valor={evidencias.length} />
              <MiniCard titulo="Elegidas" valor={seleccionadasTotales.length} />
            </div>
          </div>
        </section>

        {puedeGestionar ? (
          <VistaAdmin
            campaniaForm={campaniaForm}
            setCampaniaForm={setCampaniaForm}
            crearCampania={crearCampania}
            campanias={campanias}
            evidencias={evidenciasFiltradasPorCampania}
            cambiarEstadoCampania={cambiarEstadoCampania}
            seleccionarFoto={seleccionarFoto}
            descartarFoto={descartarFoto}
            eliminarFoto={eliminarFoto}
            descargarSeleccionadas={descargarSeleccionadas}
            descargando={descargando}
            seleccionadas={seleccionadasFiltradas.length}
            campaniaFiltro={campaniaFiltro}
            setCampaniaFiltro={setCampaniaFiltro}
          />
        ) : (
          <VistaComunicador
            campaniasActivas={campaniasActivas}
            evidenciaForm={evidenciaForm}
            setEvidenciaForm={setEvidenciaForm}
            subirImagen={subirImagen}
            subirEvidencia={subirEvidencia}
            subiendo={subiendo}
            evidencias={evidenciasVisibles}
          />
        )}
      </div>
    </ProtegerRuta>
  );
}

function VistaAdmin({
  campaniaForm,
  setCampaniaForm,
  crearCampania,
  campanias,
  evidencias,
  cambiarEstadoCampania,
  seleccionarFoto,
  descartarFoto,
  eliminarFoto,
  descargarSeleccionadas,
  descargando,
  seleccionadas,
  campaniaFiltro,
  setCampaniaFiltro,
}: any) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
      <div className="space-y-6">
        <Panel titulo="Nueva actividad" subtitulo="Habilita recepción de fotos">
          <div className="space-y-4">
            <Input
              label="Actividad"
              placeholder="CALEB 2026"
              value={campaniaForm.titulo}
              onChange={(v: string) =>
                setCampaniaForm({ ...campaniaForm, titulo: v })
              }
            />

            <Input
              label="Fecha límite"
              type="date"
              value={campaniaForm.fechaLimite}
              onChange={(v: string) =>
                setCampaniaForm({ ...campaniaForm, fechaLimite: v })
              }
            />

            <Input
              label="Indicaciones"
              placeholder="Qué fotos deben subir"
              value={campaniaForm.descripcion}
              onChange={(v: string) =>
                setCampaniaForm({ ...campaniaForm, descripcion: v })
              }
            />

            <button
              onClick={crearCampania}
              className="h-12 w-full rounded-2xl bg-[#059669] text-sm font-bold text-white transition hover:bg-[#047857]"
            >
              Crear actividad
            </button>
          </div>
        </Panel>

        <Panel titulo="Actividades" subtitulo="Estado de recepción">
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Actividad</th>
                  <th className="px-4 py-3">Límite</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>

              <tbody>
                {campanias.map((c: Campania) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-4 py-4 font-bold text-slate-800">
                      {c.titulo}
                    </td>

                    <td className="px-4 py-4 text-slate-500">
                      {c.fechaLimite}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        onClick={() => cambiarEstadoCampania(c)}
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          c.activa
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {c.activa ? "Activa" : "Cerrada"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel titulo="Fotos recibidas" subtitulo="Filtra por campaña y descarga solo las seleccionadas">
        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={campaniaFiltro}
              onChange={(e) => setCampaniaFiltro(e.target.value)}
              className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-[#44D7A8]"
            >
              <option value="">Todas las campañas</option>

              {campanias.map((c: Campania) => (
                <option key={c.id} value={c.id}>
                  {c.titulo}
                </option>
              ))}
            </select>

            <p className="text-sm font-semibold text-slate-500">
              {seleccionadas} seleccionadas
            </p>
          </div>

          <button
            onClick={() => descargarSeleccionadas(campaniaFiltro || undefined)}
            disabled={descargando || seleccionadas === 0}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#111827] px-5 py-3 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={17} />
            {descargando ? "Descargando..." : "Descargar seleccionadas"}
          </button>
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Foto</th>
                <th className="px-4 py-3">Actividad</th>
                <th className="px-4 py-3">Iglesia</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>

            <tbody>
              {evidencias.map((e: Evidencia) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <PreviewImage evidencia={e} />
                  </td>

                  <td className="px-4 py-3 font-bold text-slate-800">
                    {e.campaignTitulo}
                  </td>

                  <td className="px-4 py-3 text-slate-500">
                    {e.iglesiaNombre}
                  </td>

                  <td className="px-4 py-3">
                    <Badge estado={e.estado} />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        title="Elegir para redes"
                        onClick={() => seleccionarFoto(e)}
                        className="rounded-xl bg-green-600 p-2 text-white"
                      >
                        <Check size={16} />
                      </button>

                      <button
                        title="Descartar"
                        onClick={() => descartarFoto(e)}
                        className="rounded-xl bg-red-500 p-2 text-white"
                      >
                        <X size={16} />
                      </button>

                      <button
                        title="Eliminar"
                        onClick={() => eliminarFoto(e)}
                        className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {evidencias.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm font-semibold text-slate-500"
                  >
                    No hay fotos para esta campaña
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:hidden">
          {evidencias.map((e: Evidencia) => (
            <FotoCard
              key={e.id}
              evidencia={e}
              admin
              seleccionarFoto={seleccionarFoto}
              descartarFoto={descartarFoto}
              eliminarFoto={eliminarFoto}
            />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function VistaComunicador({
  campaniasActivas,
  evidenciaForm,
  setEvidenciaForm,
  subirImagen,
  subirEvidencia,
  subiendo,
  evidencias,
}: any) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
      <Panel titulo="Subir evidencia" subtitulo="Máximo 5 fotos por envío">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Actividad
            </label>

            <select
              value={evidenciaForm.campaignId}
              onChange={(e) =>
                setEvidenciaForm({
                  ...evidenciaForm,
                  campaignId: e.target.value,
                })
              }
              className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-[#44D7A8]"
            >
              <option value="">Seleccionar actividad</option>

              {campaniasActivas.map((c: Campania) => (
                <option key={c.id} value={c.id}>
                  {c.titulo} · hasta {c.fechaLimite}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Descripción"
            placeholder="Breve descripción"
            value={evidenciaForm.descripcion}
            onChange={(v: string) =>
              setEvidenciaForm({ ...evidenciaForm, descripcion: v })
            }
          />

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <ImagePlus className="text-[#059669]" size={30} />

            <span className="mt-2 text-sm font-bold text-slate-700">
              {subiendo ? "Subiendo..." : "Seleccionar fotos"}
            </span>

            <span className="mt-1 text-xs text-slate-500">
              Puedes seleccionar hasta 5 imágenes
            </span>

            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  subirImagen(e.target.files);
                }
              }}
            />

            {evidenciaForm.imagenes.length > 0 && (
              <div className="mt-4 grid w-full grid-cols-2 gap-3">
                {evidenciaForm.imagenes.map((img: string, index: number) => (
                  <img
                    key={index}
                    src={img}
                    alt="Vista previa"
                    className="h-28 w-full rounded-2xl object-cover"
                  />
                ))}
              </div>
            )}
          </label>

          <button
            onClick={subirEvidencia}
            disabled={subiendo}
            className="h-12 w-full rounded-2xl bg-[#059669] text-sm font-bold text-white transition hover:bg-[#047857] disabled:opacity-50"
          >
            Enviar evidencia
          </button>
        </div>
      </Panel>

      <Panel titulo="Mis evidencias" subtitulo="Fotos enviadas por tu iglesia">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {evidencias.map((e: Evidencia) => (
            <FotoCard key={e.id} evidencia={e} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PreviewImage({ evidencia }: { evidencia: Evidencia }) {
  const [verFoto, setVerFoto] = useState(false);

  return (
    <>
      <button onClick={() => setVerFoto(true)} className="block">
        <img
          src={evidencia.imagenUrl}
          alt={evidencia.campaignTitulo}
          className="h-14 w-20 rounded-xl object-cover transition hover:scale-[1.04]"
        />
      </button>

      {verFoto && (
        <ModalImagen evidencia={evidencia} cerrar={() => setVerFoto(false)} />
      )}
    </>
  );
}

function FotoCard({
  evidencia,
  admin = false,
  seleccionarFoto,
  descartarFoto,
  eliminarFoto,
}: any) {
  const [verFoto, setVerFoto] = useState(false);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <button onClick={() => setVerFoto(true)} className="block w-full">
          <img
            src={evidencia.imagenUrl}
            alt={evidencia.campaignTitulo}
            className="h-44 w-full object-cover transition hover:scale-[1.02]"
          />
        </button>

        <div className="p-4">
          <Badge estado={evidencia.estado} />

          <h3 className="mt-3 font-black text-slate-900">
            {evidencia.campaignTitulo}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {evidencia.iglesiaNombre}
          </p>

          <p className="mt-3 line-clamp-2 text-sm text-slate-500">
            {evidencia.descripcion || "Sin descripción"}
          </p>

          {admin && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                onClick={() => seleccionarFoto(evidencia)}
                className="rounded-xl bg-green-600 py-2 text-xs font-bold text-white"
              >
                Elegir
              </button>

              <button
                onClick={() => descartarFoto(evidencia)}
                className="rounded-xl bg-red-50 py-2 text-xs font-bold text-red-600"
              >
                Descartar
              </button>

              <button
                onClick={() => eliminarFoto(evidencia)}
                className="rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      {verFoto && (
        <ModalImagen evidencia={evidencia} cerrar={() => setVerFoto(false)} />
      )}
    </>
  );
}

function ModalImagen({
  evidencia,
  cerrar,
}: {
  evidencia: Evidencia;
  cerrar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4">
      <button
        onClick={cerrar}
        className="absolute right-5 top-5 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900"
      >
        Cerrar
      </button>

      <img
        src={evidencia.imagenUrl}
        alt={evidencia.campaignTitulo}
        className="max-h-[85vh] max-w-[95vw] rounded-2xl object-contain"
      />
    </div>
  );
}

function Panel({ titulo, subtitulo, children }: any) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
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

function MiniCard({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-2xl font-black text-slate-900">{valor}</p>
      <p className="text-xs font-bold text-slate-500">{titulo}</p>
    </div>
  );
}

function Badge({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    enviada: "bg-yellow-100 text-yellow-700",
    seleccionada: "bg-green-100 text-green-700",
    descartada: "bg-red-100 text-red-700",
  };

  const texto: Record<string, string> = {
    enviada: "Recibida",
    seleccionada: "Seleccionada",
    descartada: "Descartada",
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