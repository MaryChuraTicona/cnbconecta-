"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Iglesia {
  id: string;
  nombre: string;
}

interface Ministerio {
  id: string;
  nombre: string;
}

interface Evidencia {
  id?: string;
  titulo: string;
  descripcion: string;
  iglesia: string;
  ministerio: string;
  fecha: string;
  imagenUrl: string;
}

export default function EvidenciasPage() {
  const [iglesias, setIglesias] = useState<Iglesia[]>([]);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  const [formulario, setFormulario] = useState<Evidencia>({
    titulo: "",
    descripcion: "",
    iglesia: "",
    ministerio: "",
    fecha: "",
    imagenUrl: "",
  });

  const obtenerDatos = async () => {
    const iglesiasSnapshot = await getDocs(collection(db, "churches"));
    const ministeriosSnapshot = await getDocs(collection(db, "ministries"));
    const evidenciasSnapshot = await getDocs(collection(db, "evidences"));

    setIglesias(
      iglesiasSnapshot.docs.map((docu) => ({
        id: docu.id,
        nombre: docu.data().nombre,
      }))
    );

    setMinisterios(
      ministeriosSnapshot.docs.map((docu) => ({
        id: docu.id,
        nombre: docu.data().nombre,
      }))
    );

    setEvidencias(
      evidenciasSnapshot.docs.map((docu) => ({
        id: docu.id,
        ...(docu.data() as Evidencia),
      }))
    );
  };

  const subirImagen = async (archivo: File) => {
    try {
      setSubiendoImagen(true);

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

      alert("Imagen subida correctamente");
    } catch (error) {
      console.error(error);
      alert("Error al subir imagen");
    } finally {
      setSubiendoImagen(false);
    }
  };

  const guardarEvidencia = async () => {
    if (!formulario.titulo.trim()) {
      alert("El título es obligatorio");
      return;
    }

    if (!formulario.iglesia) {
      alert("Selecciona una iglesia");
      return;
    }

    if (!formulario.fecha) {
      alert("Selecciona la fecha");
      return;
    }

    if (!formulario.imagenUrl) {
      alert("Sube una imagen");
      return;
    }

    await addDoc(collection(db, "evidences"), {
      ...formulario,
      creadoEn: new Date(),
    });

    alert("Evidencia guardada");

    setFormulario({
      titulo: "",
      descripcion: "",
      iglesia: "",
      ministerio: "",
      fecha: "",
      imagenUrl: "",
    });

    obtenerDatos();
  };

  useEffect(() => {
    obtenerDatos();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <h1 className="text-3xl font-bold text-[#44D7A8] mb-2">
          Banco de Evidencias
        </h1>

        <p className="text-sm text-gray-500 mb-8">
          Registra fotografías de actividades, campañas y eventos distritales.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input
            type="text"
            placeholder="Título de la evidencia *"
            value={formulario.titulo}
            onChange={(e) =>
              setFormulario({
                ...formulario,
                titulo: e.target.value,
              })
            }
            className="border rounded-lg p-3"
          />

          <input
            type="date"
            value={formulario.fecha}
            onChange={(e) =>
              setFormulario({
                ...formulario,
                fecha: e.target.value,
              })
            }
            className="border rounded-lg p-3"
          />

          <select
            value={formulario.iglesia}
            onChange={(e) =>
              setFormulario({
                ...formulario,
                iglesia: e.target.value,
              })
            }
            className="border rounded-lg p-3"
          >
            <option value="">Seleccionar iglesia *</option>

            {iglesias.map((iglesia) => (
              <option key={iglesia.id} value={iglesia.nombre}>
                {iglesia.nombre}
              </option>
            ))}
          </select>

          <select
            value={formulario.ministerio}
            onChange={(e) =>
              setFormulario({
                ...formulario,
                ministerio: e.target.value,
              })
            }
            className="border rounded-lg p-3"
          >
            <option value="">Seleccionar ministerio opcional</option>

            {ministerios.map((ministerio) => (
              <option key={ministerio.id} value={ministerio.nombre}>
                {ministerio.nombre}
              </option>
            ))}
          </select>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) subirImagen(archivo);
            }}
            className="border rounded-lg p-3 md:col-span-2"
          />
        </div>

        {subiendoImagen && (
          <p className="text-sm text-gray-500 mb-4">Subiendo imagen...</p>
        )}

        {formulario.imagenUrl && (
          <img
            src={formulario.imagenUrl}
            alt="Vista previa"
            className="w-full max-w-md rounded-2xl border mb-6"
          />
        )}

        <textarea
          placeholder="Descripción opcional"
          value={formulario.descripcion}
          onChange={(e) =>
            setFormulario({
              ...formulario,
              descripcion: e.target.value,
            })
          }
          className="border rounded-lg p-3 w-full min-h-[120px] mb-6"
        />

        <button
          onClick={guardarEvidencia}
          className="bg-[#44D7A8] text-white px-6 py-3 rounded-lg hover:bg-[#36b98f] transition"
        >
          Guardar evidencia
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Galería de Evidencias
            </h2>

            <p className="text-sm text-gray-500">
              Fotografías registradas para revisión y publicación.
            </p>
          </div>

          <span className="text-sm bg-[#44D7A8]/10 text-[#2FAF86] px-4 py-2 rounded-full font-medium">
            {evidencias.length} registradas
          </span>
        </div>

        {evidencias.length === 0 ? (
          <div className="border border-dashed rounded-2xl p-6 text-center text-gray-500">
            Todavía no hay evidencias registradas.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {evidencias.map((evidencia) => (
              <div
                key={evidencia.id}
                className="border rounded-2xl overflow-hidden bg-white hover:shadow-md transition"
              >
                <img
                  src={evidencia.imagenUrl}
                  alt={evidencia.titulo}
                  className="w-full h-56 object-cover"
                />

                <div className="p-5">
                  <h3 className="font-bold text-gray-800">
                    {evidencia.titulo}
                  </h3>

                  <div className="grid grid-cols-1 gap-2 text-sm mt-4">
                    <div>
                      <p className="text-gray-400">Iglesia</p>
                      <p className="font-medium text-gray-700">
                        {evidencia.iglesia}
                      </p>
                    </div>

                    {evidencia.ministerio && (
                      <div>
                        <p className="text-gray-400">Ministerio</p>
                        <p className="font-medium text-gray-700">
                          {evidencia.ministerio}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-gray-400">Fecha</p>
                      <p className="font-medium text-gray-700">
                        {evidencia.fecha}
                      </p>
                    </div>
                  </div>

                  {evidencia.descripcion && (
                    <p className="text-sm text-gray-600 mt-4">
                      {evidencia.descripcion}
                    </p>
                  )}

                  <a
                    href={evidencia.imagenUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-5 px-4 py-2 rounded-lg border text-sm hover:bg-gray-100 transition"
                  >
                    Descargar imagen
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}