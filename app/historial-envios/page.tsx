"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function HistorialEnviosPage() {
  const [envios, setEnvios] = useState<any[]>([]);

  async function cargarHistorial() {
    const q = query(
      collection(db, "historial_envios"),
      orderBy("fecha", "desc")
    );

    const querySnapshot = await getDocs(q);

    const lista: any[] = [];

    querySnapshot.forEach((doc) => {
      lista.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    setEnvios(lista);
  }

  useEffect(() => {
    cargarHistorial();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Historial de Envíos
      </h1>

      <div className="space-y-4">
        {envios.map((envio) => (
          <div
            key={envio.id}
            className="bg-white border rounded-2xl shadow p-4"
          >
            <p>
              <strong>Teléfono:</strong> {envio.telefono}
            </p>

            <p>
              <strong>Canal:</strong> {envio.canal}
            </p>

            <p>
              <strong>Estado:</strong>{" "}
              <span
                className={
                  envio.estado === "enviado"
                    ? "text-green-600 font-bold"
                    : "text-red-600 font-bold"
                }
              >
                {envio.estado}
              </span>
            </p>

            <p>
              <strong>Mensaje:</strong> {envio.mensaje}
            </p>

            <p className="text-sm text-gray-500 mt-2">
              {envio.fecha?.toDate
                ? envio.fecha.toDate().toLocaleString()
                : "Sin fecha"}
            </p>
          </div>
        ))}

        {envios.length === 0 && (
          <p className="text-gray-500">
            Todavía no hay envíos registrados.
          </p>
        )}
      </div>
    </div>
  );
}