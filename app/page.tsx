"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import {
  Building2,
  Cake,
  Church,
  Heart,
  Megaphone,
  Phone,
  Users,
} from "lucide-react";
import { db } from "@/lib/firebase";

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

  const crearLinkWhatsApp = (telefono: string, mensaje: string) => {
    const numeroLimpio = telefono.replace(/\D/g, "");
    return `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
  };

  const obtenerDatos = async () => {
    try {
      const [iglesiasSnapshot, ministeriosSnapshot, responsablesSnapshot] =
        await Promise.all([
          getDocs(collection(db, "churches")),
          getDocs(collection(db, "ministries")),
          getDocs(collection(db, "directory")),
        ]);

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
          if (mes === mesActual && dia === diaActual) {
            listaCumpleañosHoy.push(responsable);
          }
        }
      });

      setTotalIglesias(iglesiasSnapshot.docs.length);
      setTotalMinisterios(ministeriosSnapshot.docs.length);
      setTotalResponsables(responsablesSnapshot.docs.length);
      setTotalPadres(listaPadres.length);
      setTotalMadres(listaMadres.length);
      setTotalNoAplica(noAplica);
      setPadres(listaPadres);
      setMadres(listaMadres);
      setCumpleañosHoy(listaCumpleañosHoy);
      setCumpleañosMes(listaCumpleañosMes);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    }
  };

  useEffect(() => {
    obtenerDatos();
  }, []);

  const resumen = useMemo(
    () => [
      {
        titulo: "Iglesias",
        valor: totalIglesias,
        icono: Church,
        principal: true,
      },
      {
        titulo: "Ministerios",
        valor: totalMinisterios,
        icono: Building2,
      },
      {
        titulo: "Directorio",
        valor: totalResponsables,
        icono: Users,
      },
      {
        titulo: "Anuncios",
        valor: 0,
        icono: Megaphone,
      },
    ],
    [totalIglesias, totalMinisterios, totalResponsables]
  );

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-[#2FAF86]">
            Panel administrativo
          </span>

          <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            Dashboard
          </h1>

          <p className="max-w-3xl text-sm leading-6 text-slate-500 md:text-base">
            Resumen general de iglesias, ministerios, responsables, cumpleaños y
            saludos especiales del distrito.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {resumen.map((item) => (
          <MetricCard key={item.titulo} {...item} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <SmallMetric titulo="Padres" valor={totalPadres} />
        <SmallMetric titulo="Madres" valor={totalMadres} />
        <SmallMetric titulo="No aplica" valor={totalNoAplica} />
      </section>

      <SectionCard
        titulo="Cumpleaños de hoy"
        descripcion="Personas que cumplen años el día de hoy."
        contador={cumpleañosHoy.length}
        icono={<Cake size={20} />}
      >
        {cumpleañosHoy.length === 0 ? (
          <EmptyState texto="No hay cumpleaños registrados para hoy." />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {cumpleañosHoy.map((persona) => (
              <PersonCard
                key={persona.id}
                persona={persona}
                boton="Enviar saludo"
                link={crearLinkWhatsApp(
                  persona.telefono,
                  `¡Feliz cumpleaños, ${persona.nombre}!

Que Dios bendiga abundantemente tu vida, tu familia y tu servicio.

Con aprecio,
Distrito Misionero Ciudad Nueva B`
                )}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard
          titulo="Madres registradas"
          descripcion="Contactos disponibles para saludo por el Día de la Madre."
          contador={madres.length}
          icono={<Heart size={20} />}
        >
          {madres.length === 0 ? (
            <EmptyState texto="No hay madres registradas." />
          ) : (
            <div className="max-h-[520px] space-y-4 overflow-y-auto pr-1">
              {madres.map((persona) => (
                <PersonCard
                  key={persona.id}
                  persona={persona}
                  boton="Enviar saludo"
                  link={crearLinkWhatsApp(
                    persona.telefono,
                    `Estimada ${persona.nombre},

¡Feliz Día de la Madre!

Que Dios bendiga tu vida, tu hogar y tu valioso ejemplo de amor y servicio.

Con aprecio,
Distrito Misionero Ciudad Nueva B`
                  )}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          titulo="Padres registrados"
          descripcion="Contactos disponibles para saludo por el Día del Padre."
          contador={padres.length}
          icono={<Users size={20} />}
        >
          {padres.length === 0 ? (
            <EmptyState texto="No hay padres registrados." />
          ) : (
            <div className="max-h-[520px] space-y-4 overflow-y-auto pr-1">
              {padres.map((persona) => (
                <PersonCard
                  key={persona.id}
                  persona={persona}
                  boton="Enviar saludo"
                  link={crearLinkWhatsApp(
                    persona.telefono,
                    `Estimado ${persona.nombre},

¡Feliz Día del Padre!

Que Dios bendiga tu vida, tu hogar y tu liderazgo como padre.

Con aprecio,
Distrito Misionero Ciudad Nueva B`
                  )}
                />
              ))}
            </div>
          )}
        </SectionCard>
      </section>

      <SectionCard
        titulo="Cumpleaños del mes"
        descripcion="Personas registradas que cumplen años este mes."
        contador={cumpleañosMes.length}
        icono={<Cake size={20} />}
      >
        {cumpleañosMes.length === 0 ? (
          <EmptyState texto="No hay cumpleaños registrados para este mes." />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {cumpleañosMes.map((persona) => (
              <PersonCard key={persona.id} persona={persona} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function MetricCard({
  titulo,
  valor,
  icono: Icono,
  principal = false,
}: {
  titulo: string;
  valor: number;
  icono: any;
  principal?: boolean;
}) {
  return (
    <div
      className={`rounded-[26px] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
        principal
          ? "bg-[#44D7A8] text-white"
          : "border border-slate-200 bg-white text-slate-900"
      }`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`rounded-2xl p-3 ${
            principal ? "bg-white/20" : "bg-[#44D7A8]/10 text-[#2FAF86]"
          }`}
        >
          <Icono size={24} />
        </div>

        <p className="text-4xl font-black">{valor}</p>
      </div>

      <h2 className="mt-8 text-lg font-bold">{titulo}</h2>
    </div>
  );
}

function SmallMetric({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">Registrados</p>

      <div className="mt-3 flex items-end justify-between">
        <h3 className="text-lg font-bold text-slate-800">{titulo}</h3>
        <p className="text-4xl font-black text-slate-900">{valor}</p>
      </div>
    </div>
  );
}

function SectionCard({
  titulo,
  descripcion,
  contador,
  icono,
  children,
}: {
  titulo: string;
  descripcion: string;
  contador: number;
  icono: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#44D7A8]/10 text-[#2FAF86]">
            {icono}
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">{titulo}</h2>
            <p className="mt-1 text-sm text-slate-500">{descripcion}</p>
          </div>
        </div>

        <span className="w-fit rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">
          {contador}
        </span>
      </div>

      {children}
    </section>
  );
}

function PersonCard({
  persona,
  boton,
  link,
}: {
  persona: Responsable;
  boton?: string;
  link?: string;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-5 transition hover:border-[#44D7A8]/50 hover:bg-white hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-black text-slate-900">{persona.nombre}</h3>

          {persona.telefono && (
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <Phone size={15} />
              {persona.telefono}
            </p>
          )}
        </div>

        {persona.tipoPadre && (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">
            {persona.tipoPadre}
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <Info label="Iglesia" value={persona.iglesia} />
        <Info label="Ministerio" value={persona.ministerio} />
        <Info label="Cumpleaños" value={persona.cumpleaños} />
      </div>

      {link && boton && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex rounded-xl bg-[#44D7A8] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#35BD91]"
        >
          {boton}
        </a>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-700">{value || "—"}</p>
    </div>
  );
}

function EmptyState({ texto }: { texto: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
      {texto}
    </div>
  );
}