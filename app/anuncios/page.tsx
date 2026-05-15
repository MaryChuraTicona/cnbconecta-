"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { Copy, Download, Users } from "lucide-react";
import { db } from "@/lib/firebase";

interface Iglesia {
  id: string;
  nombre: string;
}

interface Ministerio {
  id: string;
  nombre: string;
}

interface Anuncio {
  id?: string;
  titulo: string;
  resumen: string;
  contenido: string;
  lugar: string;
  fecha: string;
  hora: string;
  prioridad: string;
  destinatarioTipo: string;
  ministerios: string[];
  iglesias: string[];
  estado: string;
  imagenUrl: string;
}

export default function AnunciosPage() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [iglesias, setIglesias] = useState<Iglesia[]>([]);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  const formularioInicial: Anuncio = {
    titulo: "",
    resumen: "",
    contenido: "",
    lugar: "",
    fecha: "",
    hora: "",
    prioridad: "normal",
    destinatarioTipo: "todos",
    ministerios: [],
    iglesias: [],
    estado: "pendiente",
    imagenUrl: "",
  };

  const [formulario, setFormulario] = useState<Anuncio>(formularioInicial);

  const obtenerDatos = async () => {
    try {
      const anunciosSnapshot = await getDocs(collection(db, "announcements"));
      const iglesiasSnapshot = await getDocs(collection(db, "churches"));
      const ministeriosSnapshot = await getDocs(collection(db, "ministries"));

      setAnuncios(
        anunciosSnapshot.docs.map((docu) => ({
          id: docu.id,
          ...(docu.data() as Anuncio),
        }))
      );

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
    } catch (error) {
      console.error(error);
    }
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

  const guardarAnuncio = async () => {
    if (!formulario.titulo.trim()) {
      alert("El título es obligatorio");
      return;
    }

    if (!formulario.contenido.trim()) {
      alert("El mensaje es obligatorio");
      return;
    }

    if (!formulario.imagenUrl) {
      alert("Debes subir una imagen");
      return;
    }

    if (
      formulario.destinatarioTipo === "ministerios" &&
      formulario.ministerios.length === 0
    ) {
      alert("Selecciona al menos un ministerio");
      return;
    }

    if (
      formulario.destinatarioTipo === "iglesias" &&
      formulario.iglesias.length === 0
    ) {
      alert("Selecciona al menos una iglesia");
      return;
    }

    try {
      await addDoc(collection(db, "announcements"), {
        ...formulario,
        estado: "pendiente",
        creadoEn: new Date(),
      });

      alert("Anuncio guardado");
      setFormulario(formularioInicial);
      obtenerDatos();
    } catch (error) {
      console.error(error);
      alert("Error al guardar anuncio");
    }
  };

  const crearMensajeLimpio = (anuncio: Anuncio) => {
    return `${anuncio.contenido}

${anuncio.lugar ? `Lugar: ${anuncio.lugar}` : ""}
${anuncio.fecha ? `Fecha: ${anuncio.fecha}` : ""}
${anuncio.hora ? `Hora: ${anuncio.hora}` : ""}`.trim();
  };

  const copiarMensaje = async (anuncio: Anuncio) => {
    try {
      await navigator.clipboard.writeText(crearMensajeLimpio(anuncio));
      alert("Mensaje copiado");
    } catch (error) {
      console.error(error);
      alert("No se pudo copiar el mensaje");
    }
  };

  useEffect(() => {
    obtenerDatos();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <h1 className="text-3xl font-bold text-[#44D7A8] mb-2">
          Gestión de Anuncios
        </h1>

        <p className="text-sm text-gray-500 mb-8">
          Crea anuncios con imagen, datos del evento y segmentación por iglesia
          o ministerio.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input
            type="text"
            placeholder="Título del anuncio *"
            value={formulario.titulo}
            onChange={(e) =>
              setFormulario({ ...formulario, titulo: e.target.value })
            }
            className="border rounded-lg p-3"
          />

          <input
            type="text"
            placeholder="Resumen"
            value={formulario.resumen}
            onChange={(e) =>
              setFormulario({ ...formulario, resumen: e.target.value })
            }
            className="border rounded-lg p-3"
          />

          <input
            type="text"
            placeholder="Lugar"
            value={formulario.lugar}
            onChange={(e) =>
              setFormulario({ ...formulario, lugar: e.target.value })
            }
            className="border rounded-lg p-3"
          />

          <input
            type="date"
            value={formulario.fecha}
            onChange={(e) =>
              setFormulario({ ...formulario, fecha: e.target.value })
            }
            className="border rounded-lg p-3"
          />

          <input
            type="time"
            value={formulario.hora}
            onChange={(e) =>
              setFormulario({ ...formulario, hora: e.target.value })
            }
            className="border rounded-lg p-3"
          />

          <select
            value={formulario.prioridad}
            onChange={(e) =>
              setFormulario({ ...formulario, prioridad: e.target.value })
            }
            className="border rounded-lg p-3"
          >
            <option value="normal">Prioridad normal</option>
            <option value="alta">Prioridad alta</option>
            <option value="urgente">Urgente</option>
          </select>

          <select
            value={formulario.destinatarioTipo}
            onChange={(e) =>
              setFormulario({
                ...formulario,
                destinatarioTipo: e.target.value,
                ministerios: [],
                iglesias: [],
              })
            }
            className="border rounded-lg p-3"
          >
            <option value="todos">Enviar a todos</option>
            <option value="ministerios">Ministerios específicos</option>
            <option value="iglesias">Iglesias específicas</option>
          </select>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) subirImagen(archivo);
            }}
            className="border rounded-lg p-3"
          />

          {formulario.destinatarioTipo === "ministerios" && (
            <div className="md:col-span-2 border rounded-xl p-4">
              <p className="font-semibold text-gray-700 mb-3">
                Selecciona ministerios
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ministerios.map((ministerio) => (
                  <label
                    key={ministerio.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={formulario.ministerios.includes(
                        ministerio.nombre
                      )}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormulario({
                            ...formulario,
                            ministerios: [
                              ...formulario.ministerios,
                              ministerio.nombre,
                            ],
                          });
                        } else {
                          setFormulario({
                            ...formulario,
                            ministerios: formulario.ministerios.filter(
                              (m) => m !== ministerio.nombre
                            ),
                          });
                        }
                      }}
                    />
                    {ministerio.nombre}
                  </label>
                ))}
              </div>
            </div>
          )}

          {formulario.destinatarioTipo === "iglesias" && (
            <div className="md:col-span-2 border rounded-xl p-4">
              <p className="font-semibold text-gray-700 mb-3">
                Selecciona iglesias
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {iglesias.map((iglesia) => (
                  <label
                    key={iglesia.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={formulario.iglesias.includes(iglesia.nombre)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormulario({
                            ...formulario,
                            iglesias: [...formulario.iglesias, iglesia.nombre],
                          });
                        } else {
                          setFormulario({
                            ...formulario,
                            iglesias: formulario.iglesias.filter(
                              (i) => i !== iglesia.nombre
                            ),
                          });
                        }
                      }}
                    />
                    {iglesia.nombre}
                  </label>
                ))}
              </div>
            </div>
          )}
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
          placeholder="Mensaje completo para WhatsApp *"
          value={formulario.contenido}
          onChange={(e) =>
            setFormulario({ ...formulario, contenido: e.target.value })
          }
          className="border rounded-lg p-3 w-full min-h-[180px] mb-6"
        />

        <button
          onClick={guardarAnuncio}
          className="bg-[#44D7A8] text-white px-6 py-3 rounded-lg hover:bg-[#36b98f] transition"
        >
          Guardar anuncio
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Anuncios registrados
            </h2>
            <p className="text-sm text-gray-500">
              Copia el mensaje y descarga la imagen para enviarla por WhatsApp.
            </p>
          </div>

          <span className="text-sm bg-[#44D7A8]/10 text-[#2FAF86] px-4 py-2 rounded-full font-medium">
            {anuncios.length} registrados
          </span>
        </div>

        {anuncios.length === 0 ? (
          <div className="border border-dashed rounded-2xl p-6 text-center text-gray-500">
            Todavía no hay anuncios.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {anuncios.map((anuncio) => (
              <div
                key={anuncio.id}
                className="border rounded-2xl p-5 bg-white hover:shadow-md transition"
              >
                {anuncio.imagenUrl && (
                  <img
                    src={anuncio.imagenUrl}
                    alt={anuncio.titulo}
                    className="w-full rounded-2xl border mb-4"
                  />
                )}

                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">
                      {anuncio.titulo}
                    </h3>
                    <p className="text-sm text-gray-500">{anuncio.resumen}</p>
                  </div>

                  <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium capitalize">
                    {anuncio.prioridad}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <p className="text-gray-400">Lugar</p>
                    <p className="font-medium text-gray-700">
                      {anuncio.lugar || "No definido"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">Fecha</p>
                    <p className="font-medium text-gray-700">
                      {anuncio.fecha || "No definida"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">Hora</p>
                    <p className="font-medium text-gray-700">
                      {anuncio.hora || "No definida"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">Destinatario</p>
                    <p className="font-medium text-gray-700 capitalize">
                      {anuncio.destinatarioTipo}
                    </p>
                  </div>
                </div>

                {anuncio.destinatarioTipo === "ministerios" && (
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm mb-2">
                      Ministerios seleccionados
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {anuncio.ministerios?.map((ministerio) => (
                        <span
                          key={ministerio}
                          className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                        >
                          {ministerio}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {anuncio.destinatarioTipo === "iglesias" && (
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm mb-2">
                      Iglesias seleccionadas
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {anuncio.iglesias?.map((iglesia) => (
                        <span
                          key={iglesia}
                          className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                        >
                          {iglesia}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {anuncio.contenido}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 mt-5">
                  <button
                    onClick={() => copiarMensaje(anuncio)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#44D7A8] text-white text-sm hover:bg-[#36b98f] transition"
                  >
                    <Copy size={16} />
                    Copiar mensaje
                  </button>

                  <a
                    href={anuncio.imagenUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm hover:bg-gray-100 transition"
                  >
                    <Download size={16} />
                    Descargar imagen
                  </a>

                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm hover:bg-gray-100 transition">
                    <Users size={16} />
                    {anuncio.destinatarioTipo === "todos"
                      ? "Todos"
                      : anuncio.destinatarioTipo === "ministerios"
                      ? `${anuncio.ministerios?.length || 0} ministerios`
                      : `${anuncio.iglesias?.length || 0} iglesias`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}