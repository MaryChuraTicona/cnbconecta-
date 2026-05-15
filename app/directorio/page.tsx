"use client";

import { useEffect, useState } from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { Pencil, Trash2 } from "lucide-react";

import { db } from "@/lib/firebase";

interface Iglesia {
  id: string;
  nombre: string;
}

interface Ministerio {
  id: string;
  nombre: string;
}

interface Responsable {
  id?: string;
  nombre: string;
  telefono: string;
  correo: string;
  iglesia: string;
  ministerio: string;
  cargo: string;
  cumpleaños: string;
  tipoPadre: string;
  genero: string;
  activo: boolean;
  observaciones: string;
}

export default function DirectorioPage() {
  const [iglesias, setIglesias] = useState<Iglesia[]>([]);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroIglesia, setFiltroIglesia] = useState("");
  const [filtroMinisterio, setFiltroMinisterio] = useState("");

  const formularioVacio: Responsable = {
    nombre: "",
    telefono: "",
    correo: "",
    iglesia: "",
    ministerio: "",
    cargo: "",
    cumpleaños: "",
    tipoPadre: "",
    genero: "",
    activo: true,
    observaciones: "",
  };

  const [formulario, setFormulario] =
    useState<Responsable>(formularioVacio);

  const obtenerDatos = async () => {
    try {
      const iglesiasSnapshot = await getDocs(
        collection(db, "churches")
      );

      const ministeriosSnapshot =
        await getDocs(
          collection(db, "ministries")
        );

      const responsablesSnapshot =
        await getDocs(
          collection(db, "directory")
        );

      const listaIglesias: Iglesia[] = [];
      const listaMinisterios: Ministerio[] =
        [];
      const listaResponsables: Responsable[] =
        [];

      iglesiasSnapshot.forEach((docu) => {
        listaIglesias.push({
          id: docu.id,
          nombre: docu.data().nombre,
        });
      });

      ministeriosSnapshot.forEach((docu) => {
        listaMinisterios.push({
          id: docu.id,
          nombre: docu.data().nombre,
        });
      });

      responsablesSnapshot.forEach((docu) => {
        listaResponsables.push({
          id: docu.id,
          ...(docu.data() as Responsable),
        });
      });

      setIglesias(listaIglesias);
      setMinisterios(listaMinisterios);
      setResponsables(listaResponsables);
    } catch (error) {
      console.error(error);
    }
  };

  const validarFormulario = () => {
    if (!formulario.nombre.trim()) {
      alert("El nombre es obligatorio");
      return false;
    }

    if (!formulario.telefono.trim()) {
      alert("El teléfono es obligatorio");
      return false;
    }

    if (!formulario.iglesia) {
      alert("Selecciona una iglesia");
      return false;
    }

    if (!formulario.ministerio) {
      alert("Selecciona un ministerio");
      return false;
    }

    if (!formulario.cargo.trim()) {
      alert("El cargo es obligatorio");
      return false;
    }

    if (!formulario.tipoPadre) {
      alert(
        "Selecciona Padre, Madre o No aplica"
      );
      return false;
    }

    return true;
  };

  const guardarResponsable = async () => {
    if (!validarFormulario()) return;

    try {
      if (editandoId) {
        await updateDoc(
          doc(db, "directory", editandoId),
          {
            ...formulario,
          }
        );

        alert("Responsable actualizado");

        setEditandoId(null);
      } else {
        await addDoc(collection(db, "directory"), {
          ...formulario,
          creadoEn: new Date(),
        });

        alert("Responsable guardado");
      }

      setFormulario(formularioVacio);

      obtenerDatos();
    } catch (error) {
      console.error(error);

      alert("Error al guardar");
    }
  };

  const editarResponsable = (
    persona: Responsable
  ) => {
    setFormulario({
      nombre: persona.nombre || "",
      telefono: persona.telefono || "",
      correo: persona.correo || "",
      iglesia: persona.iglesia || "",
      ministerio: persona.ministerio || "",
      cargo: persona.cargo || "",
      cumpleaños: persona.cumpleaños || "",
      tipoPadre: persona.tipoPadre || "",
      genero: persona.genero || "",
      activo: persona.activo ?? true,
      observaciones:
        persona.observaciones || "",
    });

    setEditandoId(persona.id || null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const eliminarResponsable = async (
    id?: string
  ) => {
    if (!id) return;

    const confirmar = confirm(
      "¿Eliminar responsable?"
    );

    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, "directory", id));

      obtenerDatos();
    } catch (error) {
      console.error(error);
    }
  };

  const cancelarEdicion = () => {
    setFormulario(formularioVacio);

    setEditandoId(null);
  };

  const responsablesFiltrados =
    responsables.filter((persona) => {
      const coincideNombre = persona.nombre
        .toLowerCase()
        .includes(busqueda.toLowerCase());

      const coincideIglesia =
        filtroIglesia === "" ||
        persona.iglesia === filtroIglesia;

      const coincideMinisterio =
        filtroMinisterio === "" ||
        persona.ministerio ===
          filtroMinisterio;

      return (
        coincideNombre &&
        coincideIglesia &&
        coincideMinisterio
      );
    });

  useEffect(() => {
    obtenerDatos();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-[#44D7A8] mb-2">
          Directorio Distrital
        </h1>

        <p className="text-sm text-gray-500 mb-8">
          Los campos marcados con * son
          obligatorios.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input
            type="text"
            placeholder="Nombre completo *"
            value={formulario.nombre}
            onChange={(e) =>
              setFormulario({
                ...formulario,
                nombre: e.target.value,
              })
            }
            className="border rounded-lg p-3"
          />

          <input
            type="text"
            placeholder="Teléfono *"
            value={formulario.telefono}
            onChange={(e) =>
              setFormulario({
                ...formulario,
                telefono: e.target.value,
              })
            }
            className="border rounded-lg p-3"
          />

          <input
            type="email"
            placeholder="Correo opcional"
            value={formulario.correo}
            onChange={(e) =>
              setFormulario({
                ...formulario,
                correo: e.target.value,
              })
            }
            className="border rounded-lg p-3"
          />

          <input
            type="text"
            placeholder="Cargo *"
            value={formulario.cargo}
            onChange={(e) =>
              setFormulario({
                ...formulario,
                cargo: e.target.value,
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
            <option value="">
              Seleccionar iglesia *
            </option>

            {iglesias.map((iglesia) => (
              <option
                key={iglesia.id}
                value={iglesia.nombre}
              >
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
            <option value="">
              Seleccionar ministerio *
            </option>

            {ministerios.map(
              (ministerio) => (
                <option
                  key={ministerio.id}
                  value={ministerio.nombre}
                >
                  {ministerio.nombre}
                </option>
              )
            )}
          </select>

          <input
            type="date"
            value={formulario.cumpleaños}
            onChange={(e) =>
              setFormulario({
                ...formulario,
                cumpleaños:
                  e.target.value,
              })
            }
            className="border rounded-lg p-3"
          />

          <select
            value={formulario.genero}
            onChange={(e) =>
              setFormulario({
                ...formulario,
                genero: e.target.value,
              })
            }
            className="border rounded-lg p-3"
          >
            <option value="">
              Género opcional
            </option>

            <option value="masculino">
              Masculino
            </option>

            <option value="femenino">
              Femenino
            </option>
          </select>

          <select
            value={formulario.tipoPadre}
            onChange={(e) =>
              setFormulario({
                ...formulario,
                tipoPadre:
                  e.target.value,
              })
            }
            className="border rounded-lg p-3"
          >
            <option value="">
              Padre / Madre / No aplica *
            </option>

            <option value="padre">
              Padre
            </option>

            <option value="madre">
              Madre
            </option>

            <option value="no aplica">
              No aplica
            </option>
          </select>

          <select
            value={
              formulario.activo
                ? "activo"
                : "inactivo"
            }
            onChange={(e) =>
              setFormulario({
                ...formulario,
                activo:
                  e.target.value ===
                  "activo",
              })
            }
            className="border rounded-lg p-3"
          >
            <option value="activo">
              Activo
            </option>

            <option value="inactivo">
              Inactivo
            </option>
          </select>
        </div>

        <textarea
          placeholder="Observaciones opcionales"
          value={formulario.observaciones}
          onChange={(e) =>
            setFormulario({
              ...formulario,
              observaciones:
                e.target.value,
            })
          }
          className="border rounded-lg p-3 w-full min-h-[120px] mb-6"
        />

        <div className="flex gap-3">
          <button
            onClick={guardarResponsable}
            className="bg-[#44D7A8] text-white px-6 py-3 rounded-lg"
          >
            {editandoId
              ? "Actualizar Responsable"
              : "Guardar Responsable"}
          </button>

          {editandoId && (
            <button
              onClick={cancelarEdicion}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-xl font-bold mb-6">
          Buscar y filtrar
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre"
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
            }
            className="border rounded-lg p-3"
          />

          <select
            value={filtroIglesia}
            onChange={(e) =>
              setFiltroIglesia(
                e.target.value
              )
            }
            className="border rounded-lg p-3"
          >
            <option value="">
              Todas las iglesias
            </option>

            {iglesias.map((iglesia) => (
              <option
                key={iglesia.id}
                value={iglesia.nombre}
              >
                {iglesia.nombre}
              </option>
            ))}
          </select>

          <select
            value={filtroMinisterio}
            onChange={(e) =>
              setFiltroMinisterio(
                e.target.value
              )
            }
            className="border rounded-lg p-3"
          >
            <option value="">
              Todos los ministerios
            </option>

            {ministerios.map(
              (ministerio) => (
                <option
                  key={ministerio.id}
                  value={ministerio.nombre}
                >
                  {ministerio.nombre}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {responsablesFiltrados.map(
          (persona) => (
            <div
              key={persona.id}
              className="border border-gray-200 rounded-2xl p-5 bg-white hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {persona.nombre}
                  </h2>

                  <p className="text-sm text-gray-500">
                    {persona.cargo}
                  </p>
                </div>

                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    persona.activo
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {persona.activo
                    ? "Activo"
                    : "Inactivo"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400">
                    Teléfono
                  </p>

                  <p className="font-medium text-gray-700">
                    {persona.telefono}
                  </p>
                </div>

                {persona.correo && (
                  <div>
                    <p className="text-gray-400">
                      Correo
                    </p>

                    <p className="font-medium text-gray-700">
                      {persona.correo}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-gray-400">
                    Iglesia
                  </p>

                  <p className="font-medium text-gray-700">
                    {persona.iglesia}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400">
                    Ministerio
                  </p>

                  <p className="font-medium text-gray-700">
                    {persona.ministerio}
                  </p>
                </div>

                {persona.cumpleaños && (
                  <div>
                    <p className="text-gray-400">
                      Cumpleaños
                    </p>

                    <p className="font-medium text-gray-700">
                      {persona.cumpleaños}
                    </p>
                  </div>
                )}

                {persona.tipoPadre && (
                  <div>
                    <p className="text-gray-400">
                      Condición familiar
                    </p>

                    <p className="font-medium text-gray-700 capitalize">
                      {persona.tipoPadre}
                    </p>
                  </div>
                )}
              </div>

              {persona.observaciones && (
                <div className="mt-4 border-t pt-3">
                  <p className="text-gray-400 text-sm">
                    Observaciones
                  </p>

                  <p className="text-sm text-gray-700">
                    {persona.observaciones}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() =>
                    editarResponsable(
                      persona
                    )
                  }
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition"
                >
                  Editar
                </button>

                <button
                  onClick={() =>
                    eliminarResponsable(
                      persona.id
                    )
                  }
                  className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm hover:bg-red-100 transition"
                >
                  Eliminar
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}