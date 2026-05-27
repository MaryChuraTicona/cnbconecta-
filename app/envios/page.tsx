"use client";

import { useState } from "react";

export default function EnviosPage() {

  const [telefono, setTelefono] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  // =========================
  // ENVIAR WHATSAPP
  // =========================

  async function enviarMensaje() {

    if (
      !telefono ||
      !mensaje
    ) {

      alert(
        "Completa todos los campos"
      );

      return;
    }

    try {

      setLoading(true);

      const respuesta =
        await fetch(
          "/api/whatsapp/enviar",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              telefono,
              mensaje,
            }),
          }
        );

      const data =
        await respuesta.json();

      console.log(data);

      if (!respuesta.ok) {

        alert(
          data.error ||
          "Error enviando mensaje"
        );

        return;
      }

      alert(
        "Mensaje enviado correctamente"
      );

      setTelefono("");

      setMensaje("");

    } catch (error) {

      console.log(error);

      alert(
        "Error enviando WhatsApp"
      );

    } finally {

      setLoading(false);
    }
  }

  // =========================
  // VISTA
  // =========================

  return (
    <div className="p-6">

      <h1 className="text-3xl font-bold mb-6">
        Envíos WhatsApp
      </h1>

      <div className="bg-white rounded-2xl shadow p-6 space-y-4 max-w-xl">

        {/* TELÉFONO */}

        <div>

          <label className="block mb-1 font-medium">
            Número WhatsApp
          </label>

          <input
            type="text"
            placeholder="51999999999"
            value={telefono}
            onChange={(e) =>
              setTelefono(
                e.target.value
              )
            }
            className="w-full border rounded-xl p-3"
          />

        </div>

        {/* MENSAJE */}

        <div>

          <label className="block mb-1 font-medium">
            Mensaje
          </label>

          <textarea
            placeholder="Escribe tu mensaje..."
            value={mensaje}
            onChange={(e) =>
              setMensaje(
                e.target.value
              )
            }
            className="w-full border rounded-xl p-3 h-40"
          />

        </div>

        {/* BOTÓN */}

        <button
          onClick={enviarMensaje}
          disabled={loading}
          className="bg-[#44D7A8] text-white px-6 py-3 rounded-xl font-semibold"
        >

          {loading
            ? "Enviando..."
            : "Enviar WhatsApp"}

        </button>

      </div>

    </div>
  );
}