import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const { telefono, mensaje } = await request.json();

    if (!telefono || !mensaje) {
      return NextResponse.json(
        { error: "Faltan teléfono o mensaje" },
        { status: 400 }
      );
    }

    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const version = process.env.WHATSAPP_API_VERSION || "v23.0";

    const respuesta = await fetch(
      `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: telefono,
          type: "text",
          text: {
            body: mensaje,
          },
        }),
      }
    );

    const data = await respuesta.json();

    await adminDb.collection("historial_envios").add({
      telefono,
      mensaje,
      canal: "whatsapp",
      estado: respuesta.ok ? "enviado" : "error",
      respuesta: data,
      fecha: new Date(),
    });

    if (!respuesta.ok) {
      return NextResponse.json(
        {
          error: data.error?.message || "Error enviando WhatsApp",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}