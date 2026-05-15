"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { Copy, Send, MessageCircle } from "lucide-react";
import { db } from "@/lib/firebase";

interface Anuncio {
  id?: string;
  titulo: string;
  contenido: string;
  lugar?: string;
  fecha?: string;
  hora?: string;
  destinatarioTipo: string;
  ministerios: string[];
  iglesias: string[];
  imagenUrl: string;
}

interface Responsable {
  id?: string;
  nombre: string;
  telefono: string;
  iglesia: string;
  ministerio: string;
  activo: boolean;
}

export default function EnviosPage() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [anuncioSeleccionado, setAnuncioSeleccionado] =
    useState<Anuncio | null>(null);

  const obtenerDatos = async () => {
    try {
      const anunciosSnapshot = await getDocs(collection(db, "announcements"));
      const responsablesSnapshot = await getDocs(collection(db, "directory"));

      setAnuncios(
        anunciosSnapshot.docs.map((docu) => ({
          id: docu.id,
          ...(docu.data() as Anuncio),
        }))
      );

      setResponsables(
        responsablesSnapshot.docs.map((docu) => ({
          id: docu.id,
          ...(docu.data() as Responsable),
        }))
      );
    } catch (error) {
      console.error(error);
    }
  };

  const obtenerDestinatarios = () => {
    if (!anuncioSeleccionado) return [];

    return responsables.filter((persona) => {
      if (!persona.activo) return false;

      if (anuncioSeleccionado.destinatarioTipo === "todos") {
        return true;
      }

      if (anuncioSeleccionado.destinatarioTipo === "iglesias") {
        return anuncioSeleccionado.iglesias?.includes(persona.iglesia);
      }

      if (anuncioSeleccionado.destinatarioTipo === "ministerios") {
        return anuncioSeleccionado.ministerios?.includes(persona.ministerio);
      }

      return false;
    });
  };

  const crearMensaje = (anuncio: Anuncio) => {
    return `${anuncio.contenido}

${anuncio.lugar ? `Lugar: ${anuncio.lugar}` : ""}
${anuncio.fecha ? `Fecha: ${anuncio.fecha}` : ""}
${anuncio.hora ? `Hora: ${anuncio.hora}` : ""}

${anuncio.imagenUrl ? `Imagen del anuncio: ${anuncio.imagenUrl}` : ""}`.trim();
  };

  const copiarTelefonos = async () => {
    const destinatarios = obtenerDestinatarios();

    const telefonos = destinatarios
      .map((persona) => persona.telefono)
      .join("\n");

    await navigator.clipboard.writeText(telefonos);

    alert("Teléfonos copiados");
  };

  const copiarMensaje = async () => {
    if (!anuncioSeleccionado) return;

    await navigator.clipboard.writeText(crearMensaje(anuncioSeleccionado));

    alert("Mensaje copiado");
  };

  const registrarEnvio = async (persona: Responsable) => {
    if (!anuncioSeleccionado) return;

    try {
      await addDoc(collection(db, "send_logs"), {
        anuncioId: anuncioSeleccionado.id,
        anuncioTitulo: anuncioSeleccionado.titulo,
        destinatario: persona.nombre,
        telefono: persona.telefono,
        iglesia: persona.iglesia,
        ministerio: persona.ministerio,
        estado: "enviado_manual",
        fechaEnvio: new Date(),
      });
    } catch (error) {
      console.error(error);
      alert("No se pudo registrar el envío");
    }
  };

  useEffect(() => {
    obtenerDatos();
  }, []);

  const destinatarios = obtenerDestinatarios();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <h1 className="text-3xl font-bold text-[#44D7A8] mb-2">
          Preparar Envíos
        </h1>

        <p className="text-sm text-gray-500">
          Selecciona un anuncio, revisa los destinatarios y envía por WhatsApp.
          Cada envío manual quedará registrado en el historial.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar anuncio
        </label>

        <select
          value={anuncioSeleccionado?.id || ""}
          onChange={(e) => {
            const anuncio = anuncios.find((a) => a.id === e.target.value);
            setAnuncioSeleccionado(anuncio || null);
          }}
          className="border rounded-lg p-3 w-full"
        >
          <option value="">Selecciona un anuncio</option>

          {anuncios.map((anuncio) => (
            <option key={anuncio.id} value={anuncio.id}>
              {anuncio.titulo}
            </option>
          ))}
        </select>
      </div>

      {anuncioSeleccionado && (
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {anuncioSeleccionado.titulo}
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Destinatarios encontrados: {destinatarios.length}
              </p>

              <p className="text-sm text-gray-500 mt-1">
                Tipo de envío: {anuncioSeleccionado.destinatarioTipo}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={copiarTelefonos}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#44D7A8] text-white text-sm hover:bg-[#36b98f]"
              >
                <Copy size={16} />
                Copiar teléfonos
              </button>

              <button
                onClick={copiarMensaje}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm hover:bg-gray-100"
              >
                <Copy size={16} />
                Copiar mensaje
              </button>

              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 text-gray-500 text-sm cursor-not-allowed"
              >
                <Send size={16} />
                API próximamente
              </button>
            </div>
          </div>

          {anuncioSeleccionado.imagenUrl && (
            <img
              src={anuncioSeleccionado.imagenUrl}
              alt={anuncioSeleccionado.titulo}
              className="w-full max-w-md rounded-2xl border mb-6"
            />
          )}

          <div className="border rounded-2xl p-4 mb-6">
            <p className="text-sm text-gray-400 mb-2">Mensaje</p>

            <p className="text-sm text-gray-700 whitespace-pre-line">
              {crearMensaje(anuncioSeleccionado)}
            </p>
          </div>

          {destinatarios.length === 0 ? (
            <div className="border border-dashed rounded-2xl p-6 text-center text-gray-500">
              No se encontraron destinatarios activos para este anuncio.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {destinatarios.map((persona) => (
                <div
                  key={persona.id}
                  className="border border-gray-200 rounded-2xl p-5 bg-white hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-gray-800">
                        {persona.nombre}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {persona.ministerio}
                      </p>
                    </div>

                    <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                      Activo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
                    <div>
                      <p className="text-gray-400">Teléfono</p>

                      <p className="font-medium text-gray-700">
                        {persona.telefono}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400">Iglesia</p>

                      <p className="font-medium text-gray-700">
                        {persona.iglesia}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      await registrarEnvio(persona);

                      window.open(
                        `https://wa.me/${persona.telefono.replace(
                          /\D/g,
                          ""
                        )}?text=${encodeURIComponent(
                          crearMensaje(anuncioSeleccionado)
                        )}`,
                        "_blank"
                      );
                    }}
                    className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-lg bg-[#44D7A8] text-white text-sm hover:bg-[#36b98f] transition"
                  >
                    <MessageCircle size={16} />
                    Enviar WhatsApp
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}