"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";

interface Responsable {
  id?: string;
  nombre: string;
  telefono: string;
  cumpleaños: string;
  iglesia: string;
  ministerio: string;
  tipoPadre: string;
}

export default function Dashboard() {
  const router = useRouter();

  const [totalIglesias, setTotalIglesias] = useState(0);
  const [totalMinisterios, setTotalMinisterios] = useState(0);
  const [totalResponsables, setTotalResponsables] = useState(0);

  const [totalPadres, setTotalPadres] = useState(0);
  const [totalMadres, setTotalMadres] = useState(0);
  const [totalNoAplica, setTotalNoAplica] = useState(0);

  const [cumpleañosHoy, setCumpleañosHoy] = useState<Responsable[]>([]);
  const [cumpleañosMes, setCumpleañosMes] = useState<Responsable[]>([]);
  const [padres, setPadres] = useState<Responsable[]>([]);
  const [madres, setMadres] = useState<Responsable[]>([]);

  const cerrarSesion = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const crearLinkWhatsApp = (telefono: string, mensaje: string) => {
    const numeroLimpio = telefono.replace(/\D/g, "");
    return `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
  };

  const obtenerDatos = async () => {
    try {
      const iglesiasSnapshot = await getDocs(collection(db, "churches"));
      const ministeriosSnapshot = await getDocs(collection(db, "ministries"));
      const responsablesSnapshot = await getDocs(collection(db, "directory"));

      const hoy = new Date();
      const mesActual = hoy.getMonth() + 1;
      const diaActual = hoy.getDate();

      const listaCumpleañosHoy: Responsable[] = [];
      const listaCumpleañosMes: Responsable[] = [];
      const listaPadres: Responsable[] = [];
      const listaMadres: Responsable[] = [];

      let noAplica = 0;

      responsablesSnapshot.forEach((docu) => {
        const data = docu.data() as Responsable;
        const tipoPadre = data.tipoPadre?.toLowerCase().trim();

        const responsable: Responsable = {
          id: docu.id,
          ...data,
        };

        if (tipoPadre === "padre") listaPadres.push(responsable);
        if (tipoPadre === "madre") listaMadres.push(responsable);
        if (tipoPadre === "no aplica") noAplica++;

        if (data.cumpleaños) {
          const [, mes, dia] = data.cumpleaños.split("-").map(Number);

          if (mes === mesActual) listaCumpleañosMes.push(responsable);
          if (mes === mesActual && dia === diaActual)
            listaCumpleañosHoy.push(responsable);
        }
      });

      setTotalIglesias(iglesiasSnapshot.docs.length);
      setTotalMinisterios(ministeriosSnapshot.docs.length);
      setTotalResponsables(responsablesSnapshot.docs.length);

      setPadres(listaPadres);
      setMadres(listaMadres);
      setTotalPadres(listaPadres.length);
      setTotalMadres(listaMadres.length);
      setTotalNoAplica(noAplica);

      setCumpleañosHoy(listaCumpleañosHoy);
      setCumpleañosMes(listaCumpleañosMes);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    obtenerDatos();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#44D7A8] mb-4">
            CNB Conecta+
          </h1>

          <p className="text-gray-600">
            Plataforma Oficial del Distrito Misionero Ciudad Nueva B
          </p>
        </div>

        <button
          onClick={cerrarSesion}
          className="px-5 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#44D7A8] text-white p-6 rounded-2xl shadow">
          <h2 className="text-lg font-semibold">Iglesias</h2>
          <p className="text-4xl font-bold mt-3">{totalIglesias}</p>
        </div>

        <div className="bg-white border p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700">Ministerios</h2>
          <p className="text-4xl font-bold mt-3 text-gray-800">
            {totalMinisterios}
          </p>
        </div>

        <div className="bg-white border p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700">Directorio</h2>
          <p className="text-4xl font-bold mt-3 text-gray-800">
            {totalResponsables}
          </p>
        </div>

        <div className="bg-white border p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700">Anuncios</h2>
          <p className="text-4xl font-bold mt-3 text-gray-800">0</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700">
            Padres registrados
          </h2>
          <p className="text-4xl font-bold mt-3 text-gray-800">
            {totalPadres}
          </p>
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700">
            Madres registradas
          </h2>
          <p className="text-4xl font-bold mt-3 text-gray-800">
            {totalMadres}
          </p>
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700">No aplica</h2>
          <p className="text-4xl font-bold mt-3 text-gray-800">
            {totalNoAplica}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Cumpleaños de hoy
            </h2>
            <p className="text-sm text-gray-500">
              Personas que cumplen años el día de hoy.
            </p>
          </div>

          <span className="text-sm bg-[#44D7A8]/10 text-[#2FAF86] px-4 py-2 rounded-full font-medium">
            {cumpleañosHoy.length} registrados
          </span>
        </div>

        {cumpleañosHoy.length === 0 ? (
          <div className="border border-dashed rounded-2xl p-6 text-center text-gray-500">
            No hay cumpleaños registrados para hoy.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {cumpleañosHoy.map((persona) => (
              <div
                key={persona.id}
                className="border border-gray-200 rounded-2xl p-5 hover:shadow-md transition"
              >
                <h3 className="font-bold text-gray-800">{persona.nombre}</h3>

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

                  <div>
                    <p className="text-gray-400">Ministerio</p>
                    <p className="font-medium text-gray-700">
                      {persona.ministerio}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">Cumpleaños</p>
                    <p className="font-medium text-gray-700">
                      {persona.cumpleaños}
                    </p>
                  </div>
                </div>

                <a
                  href={crearLinkWhatsApp(
                    persona.telefono,
                    `¡Feliz cumpleaños, ${persona.nombre}!

Que Dios bendiga abundantemente tu vida, tu familia y tu servicio.

Con aprecio,
Distrito Misionero Ciudad Nueva B`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-5 px-4 py-2 rounded-lg bg-[#44D7A8] text-white text-sm hover:bg-[#36b98f] transition"
                >
                  Enviar saludo por WhatsApp
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Madres registradas
              </h2>
              <p className="text-sm text-gray-500">
                Contactos disponibles para saludo por el Día de la Madre.
              </p>
            </div>

            <span className="text-sm bg-[#44D7A8]/10 text-[#2FAF86] px-4 py-2 rounded-full font-medium">
              {madres.length}
            </span>
          </div>

          {madres.length === 0 ? (
            <div className="border border-dashed rounded-2xl p-6 text-center text-gray-500">
              No hay madres registradas.
            </div>
          ) : (
            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
              {madres.map((persona) => (
                <div
                  key={persona.id}
                  className="border border-gray-200 rounded-2xl p-5"
                >
                  <h3 className="font-bold text-gray-800">{persona.nombre}</h3>

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

                    <div>
                      <p className="text-gray-400">Ministerio</p>
                      <p className="font-medium text-gray-700">
                        {persona.ministerio}
                      </p>
                    </div>
                  </div>

                  <a
                    href={crearLinkWhatsApp(
                      persona.telefono,
                      `Estimada ${persona.nombre},

¡Feliz Día de la Madre!

Que Dios bendiga tu vida, tu hogar y tu valioso ejemplo de amor y servicio.

Con aprecio,
Distrito Misionero Ciudad Nueva B`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-5 px-4 py-2 rounded-lg bg-[#44D7A8] text-white text-sm hover:bg-[#36b98f] transition"
                  >
                    Enviar saludo por WhatsApp
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Padres registrados
              </h2>
              <p className="text-sm text-gray-500">
                Contactos disponibles para saludo por el Día del Padre.
              </p>
            </div>

            <span className="text-sm bg-[#44D7A8]/10 text-[#2FAF86] px-4 py-2 rounded-full font-medium">
              {padres.length}
            </span>
          </div>

          {padres.length === 0 ? (
            <div className="border border-dashed rounded-2xl p-6 text-center text-gray-500">
              No hay padres registrados.
            </div>
          ) : (
            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
              {padres.map((persona) => (
                <div
                  key={persona.id}
                  className="border border-gray-200 rounded-2xl p-5"
                >
                  <h3 className="font-bold text-gray-800">{persona.nombre}</h3>

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

                    <div>
                      <p className="text-gray-400">Ministerio</p>
                      <p className="font-medium text-gray-700">
                        {persona.ministerio}
                      </p>
                    </div>
                  </div>

                  <a
                    href={crearLinkWhatsApp(
                      persona.telefono,
                      `Estimado ${persona.nombre},

¡Feliz Día del Padre!

Que Dios bendiga tu vida, tu hogar y tu liderazgo como padre.

Con aprecio,
Distrito Misionero Ciudad Nueva B`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-5 px-4 py-2 rounded-lg bg-[#44D7A8] text-white text-sm hover:bg-[#36b98f] transition"
                  >
                    Enviar saludo por WhatsApp
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Cumpleaños del mes
            </h2>
            <p className="text-sm text-gray-500">
              Personas registradas que cumplen años este mes.
            </p>
          </div>

          <span className="text-sm bg-[#44D7A8]/10 text-[#2FAF86] px-4 py-2 rounded-full font-medium">
            {cumpleañosMes.length} registrados
          </span>
        </div>

        {cumpleañosMes.length === 0 ? (
          <div className="border border-dashed rounded-2xl p-6 text-center text-gray-500">
            No hay cumpleaños registrados para este mes.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {cumpleañosMes.map((persona) => (
              <div
                key={persona.id}
                className="border border-gray-200 rounded-2xl p-5 hover:shadow-md transition"
              >
                <h3 className="font-bold text-gray-800">{persona.nombre}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
                  <div>
                    <p className="text-gray-400">Cumpleaños</p>
                    <p className="font-medium text-gray-700">
                      {persona.cumpleaños}
                    </p>
                  </div>

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

                  <div>
                    <p className="text-gray-400">Ministerio</p>
                    <p className="font-medium text-gray-700">
                      {persona.ministerio}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}