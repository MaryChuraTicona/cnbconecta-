"use client";

import { useEffect, useState } from "react";

import ProtegerRuta from "@/components/ProtegerRuta";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import {
  Building2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { db } from "@/lib/firebase";

interface Iglesia {
  id: string;
  nombre: string;
  tipo: string;
  activa: boolean;
}

export default function IglesiasPage() {
  const [nombre, setNombre] =
    useState("");

  const [busqueda, setBusqueda] =
    useState("");

  const [iglesias, setIglesias] =
    useState<Iglesia[]>([]);

  const [editandoId, setEditandoId] =
    useState<string | null>(null);

  const obtenerIglesias =
    async () => {
      try {
        const querySnapshot =
          await getDocs(
            collection(
              db,
              "churches"
            )
          );

        const lista: Iglesia[] =
          [];

        querySnapshot.forEach(
          (docu) => {
            lista.push({
              id: docu.id,
              ...(docu.data() as Omit<
                Iglesia,
                "id"
              >),
            });
          }
        );

        setIglesias(lista);

      } catch (error) {
        console.error(error);
      }
    };

  const guardarIglesia =
    async () => {
      if (!nombre.trim()) {
        alert(
          "Escribe el nombre de la iglesia"
        );

        return;
      }

      try {
        if (editandoId) {
          const referencia =
            doc(
              db,
              "churches",
              editandoId
            );

          await updateDoc(
            referencia,
            {
              nombre,
            }
          );

          alert(
            "Iglesia actualizada"
          );

          setEditandoId(
            null
          );

        } else {
          await addDoc(
            collection(
              db,
              "churches"
            ),
            {
              nombre,
              tipo: "iglesia",
              activa: true,
              creadoEn:
                new Date(),
            }
          );

          alert(
            "Iglesia guardada"
          );
        }

        setNombre("");

        obtenerIglesias();

      } catch (error) {
        console.error(error);

        alert(
          "Error guardando iglesia"
        );
      }
    };

  const eliminarIglesia =
    async (id: string) => {
      const confirmar =
        confirm(
          "¿Eliminar iglesia?"
        );

      if (!confirmar) return;

      try {
        await deleteDoc(
          doc(
            db,
            "churches",
            id
          )
        );

        obtenerIglesias();

      } catch (error) {
        console.error(error);
      }
    };

  const editarIglesia = (
    iglesia: Iglesia
  ) => {
    setNombre(
      iglesia.nombre
    );

    setEditandoId(
      iglesia.id
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    obtenerIglesias();
  }, []);

  const iglesiasFiltradas =
    iglesias.filter(
      (iglesia) =>
        iglesia.nombre
          .toLowerCase()
          .includes(
            busqueda.toLowerCase()
          )
    );

  return (
    <ProtegerRuta permiso="iglesias">
      <div className="space-y-8">
        {/* HEADER */}

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="text-sm font-semibold text-[#2FAF86]">
                Área de Comunicaciones
              </span>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                Gestión de Iglesias
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 md:text-base">
                Administra las iglesias
                registradas dentro del
                distrito y asigna
                comunicadores.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5">
              <div className="flex items-center justify-between gap-8">
                <div className="text-slate-500">
                  <Building2
                    size={22}
                  />
                </div>

                <p className="text-3xl font-black text-slate-900">
                  {
                    iglesias.length
                  }
                </p>
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-600">
                Iglesias registradas
              </p>
            </div>
          </div>
        </section>

        {/* FORM */}

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-[#44D7A8]/10 p-3 text-[#2FAF86]">
              <Plus size={22} />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">
                {editandoId
                  ? "Editar iglesia"
                  : "Nueva iglesia"}
              </h2>

              <p className="text-sm text-slate-500">
                Registrar iglesia
                dentro del sistema
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            <input
              type="text"
              value={nombre}
              onChange={(e) =>
                setNombre(
                  e.target.value
                )
              }
              placeholder="Nombre de la iglesia"
              className="h-14 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#44D7A8]"
            />

            <button
              onClick={
                guardarIglesia
              }
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#111827] px-6 text-sm font-bold text-white transition hover:bg-black"
            >
              <Plus size={18} />

              {editandoId
                ? "Actualizar"
                : "Guardar"}
            </button>
          </div>
        </section>

        {/* LISTA */}

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Iglesias registradas
              </h2>

              <p className="text-sm text-slate-500">
                Lista oficial de
                iglesias del distrito
              </p>
            </div>

            <div className="relative w-full lg:w-[340px]">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Buscar iglesia..."
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(
                    e.target.value
                  )
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-[#44D7A8]"
              />
            </div>
          </div>

          <div className="space-y-4">
            {iglesiasFiltradas.map(
              (iglesia) => (
                <div
                  key={
                    iglesia.id
                  }
                  className="flex flex-col gap-5 rounded-[24px] border border-slate-200 bg-slate-50/60 p-5 transition hover:border-[#44D7A8]/40 hover:bg-white hover:shadow-sm lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8fff4] text-[#16a36a]">
                      <Building2
                        size={28}
                      />
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        {
                          iglesia.nombre
                        }
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {
                          iglesia.tipo
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        editarIglesia(
                          iglesia
                        )
                      }
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700 transition hover:bg-yellow-200"
                    >
                      <Pencil
                        size={18}
                      />
                    </button>

                    <button
                      onClick={() =>
                        eliminarIglesia(
                          iglesia.id
                        )
                      }
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600 transition hover:bg-red-200"
                    >
                      <Trash2
                        size={18}
                      />
                    </button>
                  </div>
                </div>
              )
            )}

            {iglesiasFiltradas.length ===
              0 && (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm font-medium text-slate-500">
                No se encontraron
                iglesias
              </div>
            )}
          </div>
        </section>
      </div>
    </ProtegerRuta>
  );
}