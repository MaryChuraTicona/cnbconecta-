"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface HistorialEnvio {
  id?: string;
  anuncioTitulo: string;
  destinatario: string;
  telefono: string;
  iglesia: string;
  ministerio: string;
  estado: string;
  fechaEnvio?: {
    seconds: number;
  };
}

export default function HistorialEnviosPage() {
  const [historial, setHistorial] = useState<HistorialEnvio[]>([]);

  const obtenerHistorial = async () => {
    try {
      const snapshot = await getDocs(collection(db, "send_logs"));

      const lista: HistorialEnvio[] = snapshot.docs.map((docu) => ({
        id: docu.id,
        ...(docu.data() as HistorialEnvio),
      }));

      setHistorial(lista);
    } catch (error) {
      console.error(error);
    }
  };

  const formatearFecha = (fecha?: { seconds: number }) => {
    if (!fecha?.seconds) return "Sin fecha";

    return new Date(fecha.seconds * 1000).toLocaleString("es-PE");
  };

  useEffect(() => {
    obtenerHistorial();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
      <h1 className="text-3xl font-bold text-[#44D7A8] mb-2">
        Historial de Envíos
      </h1>

      <p className="text-sm text-gray-500 mb-8">
        Registro de envíos manuales preparados desde la plataforma.
      </p>

      {historial.length === 0 ? (
        <div className="border border-dashed rounded-2xl p-6 text-center text-gray-500">
          Todavía no hay envíos registrados.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {historial.map((envio) => (
            <div
              key={envio.id}
              className="border border-gray-200 rounded-2xl p-5 bg-white hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-bold text-gray-800">
                    {envio.destinatario}
                  </h2>

                  <p className="text-sm text-gray-500">
                    {envio.anuncioTitulo}
                  </p>
                </div>

                <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                  {envio.estado}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400">Teléfono</p>
                  <p className="font-medium text-gray-700">{envio.telefono}</p>
                </div>

                <div>
                  <p className="text-gray-400">Fecha</p>
                  <p className="font-medium text-gray-700">
                    {formatearFecha(envio.fechaEnvio)}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400">Iglesia</p>
                  <p className="font-medium text-gray-700">{envio.iglesia}</p>
                </div>

                <div>
                  <p className="text-gray-400">Ministerio</p>
                  <p className="font-medium text-gray-700">
                    {envio.ministerio}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}