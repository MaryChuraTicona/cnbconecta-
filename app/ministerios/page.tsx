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

interface Ministerio {
  id: string;
  nombre: string;
  activo: boolean;
}

export default function MinisteriosPage() {
  const [nombre, setNombre] = useState("");
  const [ministerios, setMinisterios] =
    useState<Ministerio[]>([]);

  const [editandoId, setEditandoId] =
    useState<string | null>(null);

  const obtenerMinisterios = async () => {
    try {
      const querySnapshot = await getDocs(
        collection(db, "ministries")
      );

      const lista: Ministerio[] = [];

      querySnapshot.forEach((docu) => {
        lista.push({
          id: docu.id,
          ...(docu.data() as Omit<
            Ministerio,
            "id"
          >),
        });
      });

      setMinisterios(lista);
    } catch (error) {
      console.error(error);
    }
  };

  const guardarMinisterio = async () => {
    if (!nombre) {
      alert("Escribe un nombre");
      return;
    }

    try {
      if (editandoId) {
        await updateDoc(
          doc(db, "ministries", editandoId),
          {
            nombre,
          }
        );

        alert("Ministerio actualizado");

        setEditandoId(null);
      } else {
        await addDoc(collection(db, "ministries"), {
          nombre,
          activo: true,
          creadoEn: new Date(),
        });

        alert("Ministerio guardado");
      }

      setNombre("");

      obtenerMinisterios();
    } catch (error) {
      console.error(error);
    }
  };

  const eliminarMinisterio = async (
    id: string
  ) => {
    const confirmar = confirm(
      "¿Eliminar ministerio?"
    );

    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, "ministries", id));

      obtenerMinisterios();
    } catch (error) {
      console.error(error);
    }
  };

  const editarMinisterio = (
    ministerio: Ministerio
  ) => {
    setNombre(ministerio.nombre);

    setEditandoId(ministerio.id);
  };

  useEffect(() => {
    obtenerMinisterios();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h1 className="text-3xl font-bold text-[#44D7A8] mb-8">
        Gestión de Ministerios
      </h1>

      <div className="flex gap-3 mb-8">
        <input
          type="text"
          value={nombre}
          onChange={(e) =>
            setNombre(e.target.value)
          }
          placeholder="Nombre del ministerio"
          className="flex-1 border rounded-lg p-3"
        />

        <button
          onClick={guardarMinisterio}
          className="bg-[#44D7A8] text-white px-5 rounded-lg"
        >
          {editandoId
            ? "Actualizar"
            : "Guardar"}
        </button>
      </div>

      <div className="space-y-3">
        {ministerios.map((ministerio) => (
          <div
            key={ministerio.id}
            className="border rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-semibold">
                {ministerio.nombre}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  editarMinisterio(ministerio)
                }
                className="p-2 rounded-lg bg-yellow-100"
              >
                <Pencil size={18} />
              </button>

              <button
                onClick={() =>
                  eliminarMinisterio(
                    ministerio.id
                  )
                }
                className="p-2 rounded-lg bg-red-100"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}