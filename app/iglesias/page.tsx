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
  tipo: string;
  activa: boolean;
}

export default function IglesiasPage() {
  const [nombre, setNombre] = useState("");

  const [iglesias, setIglesias] =
    useState<Iglesia[]>([]);

  const [editandoId, setEditandoId] =
    useState<string | null>(null);

  const obtenerIglesias = async () => {
    try {
      const querySnapshot = await getDocs(
        collection(db, "churches")
      );

      const lista: Iglesia[] = [];

      querySnapshot.forEach((docu) => {
        lista.push({
          id: docu.id,
          ...(docu.data() as Omit<
            Iglesia,
            "id"
          >),
        });
      });

      setIglesias(lista);
    } catch (error) {
      console.error(error);
    }
  };

  const guardarIglesia = async () => {
    if (!nombre) {
      alert("Escribe un nombre");
      return;
    }

    try {
      if (editandoId) {
        const referencia = doc(
          db,
          "churches",
          editandoId
        );

        await updateDoc(referencia, {
          nombre,
        });

        alert("Iglesia actualizada");

        setEditandoId(null);
      } else {
        await addDoc(collection(db, "churches"), {
          nombre,
          tipo: "iglesia",
          activa: true,
          creadoEn: new Date(),
        });

        alert("Iglesia guardada");
      }

      setNombre("");

      obtenerIglesias();
    } catch (error) {
      console.error(error);

      alert("Error");
    }
  };

  const eliminarIglesia = async (
    id: string
  ) => {
    const confirmar = confirm(
      "¿Eliminar iglesia?"
    );

    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, "churches", id));

      obtenerIglesias();
    } catch (error) {
      console.error(error);
    }
  };

  const editarIglesia = (
    iglesia: Iglesia
  ) => {
    setNombre(iglesia.nombre);

    setEditandoId(iglesia.id);
  };

  useEffect(() => {
    obtenerIglesias();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h1 className="text-3xl font-bold text-[#44D7A8] mb-8">
        Gestión de Iglesias
      </h1>

      <div className="flex gap-3 mb-8">
        <input
          type="text"
          value={nombre}
          onChange={(e) =>
            setNombre(e.target.value)
          }
          placeholder="Nombre de la iglesia"
          className="flex-1 border rounded-lg p-3"
        />

        <button
          onClick={guardarIglesia}
          className="bg-[#44D7A8] text-white px-5 rounded-lg"
        >
          {editandoId
            ? "Actualizar"
            : "Guardar"}
        </button>
      </div>

      <div className="space-y-3">
        {iglesias.map((iglesia) => (
          <div
            key={iglesia.id}
            className="border rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-semibold">
                {iglesia.nombre}
              </p>

              <p className="text-sm text-gray-500">
                {iglesia.tipo}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  editarIglesia(iglesia)
                }
                className="p-2 rounded-lg bg-yellow-100"
              >
                <Pencil size={18} />
              </button>

              <button
                onClick={() =>
                  eliminarIglesia(
                    iglesia.id
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