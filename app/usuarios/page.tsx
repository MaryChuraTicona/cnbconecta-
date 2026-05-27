"use client";

import { useEffect, useState } from "react";
import ProtegerRuta from "@/components/ProtegerRuta";

import {
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import {
  Building2,
  CheckCircle2,
  Church,
  Crown,
  Mail,
  Plus,
  Search,
  Shield,
  UserRound,
  Users,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";

type RolUsuario =
  | "admin"
  | "pastor_distrital"
  | "comunicador_distrital"
  | "comunicador_iglesia";

interface Iglesia {
  id: string;
  nombre?: string;
  name?: string;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] =
    useState<any[]>([]);

  const [iglesias, setIglesias] =
    useState<Iglesia[]>([]);

  const [busqueda, setBusqueda] =
    useState("");

  const [nombre, setNombre] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [rol, setRol] =
    useState<RolUsuario>(
      "comunicador_iglesia"
    );

  const [iglesiaId, setIglesiaId] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const roles = [
    {
      value: "admin",
      label: "Administrador general",
      descripcion:
        "Acceso total al sistema",
    },

    {
      value: "pastor_distrital",
      label: "Pastor distrital",
      descripcion:
        "Puede aprobar anuncios",
    },

    {
      value:
        "comunicador_distrital",

      label:
        "Comunicador distrital",

      descripcion:
        "Gestión distrital",
    },

    {
      value:
        "comunicador_iglesia",

      label:
        "Comunicador de iglesia",

      descripcion:
        "Asignado a una iglesia",
    },
  ];

  const rolSeleccionado =
    roles.find(
      (item) =>
        item.value === rol
    );

  const requiereIglesia =
    rol ===
    "comunicador_iglesia";

  async function cargarUsuarios() {
    const querySnapshot =
      await getDocs(
        collection(db, "usuarios")
      );

    const lista: any[] = [];

    querySnapshot.forEach((docu) => {
      lista.push({
        id: docu.id,
        ...docu.data(),
      });
    });

    setUsuarios(lista);
  }

  async function cargarIglesias() {
    const querySnapshot =
      await getDocs(
        collection(db, "churches")
      );

    const lista: Iglesia[] = [];

    querySnapshot.forEach((docu) => {
      lista.push({
        id: docu.id,
        ...docu.data(),
      } as Iglesia);
    });

    setIglesias(lista);
  }

  async function crearUsuarioReal() {
    if (
      !nombre ||
      !email ||
      !password ||
      !rol
    ) {
      alert(
        "Completa todos los campos"
      );

      return;
    }

    if (
      requiereIglesia &&
      !iglesiaId
    ) {
      alert(
        "Selecciona una iglesia"
      );

      return;
    }

    try {
      setLoading(true);

      const user =
        auth.currentUser;

      if (!user) {
        alert(
          "No hay usuario autenticado"
        );

        return;
      }

      const token =
        await user.getIdToken();

      const iglesiaSeleccionada =
        iglesias.find(
          (iglesia) =>
            iglesia.id ===
            iglesiaId
        );

      const iglesiaNombre =
        requiereIglesia
          ? iglesiaSeleccionada
              ?.nombre ||
            iglesiaSeleccionada
              ?.name ||
            "Sin iglesia"
          : "Distrito CNB";

      const respuesta =
        await fetch(
          "/api/usuarios/crear",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              nombre,
              email,
              password,
              rol,
              iglesiaId:
                requiereIglesia
                  ? iglesiaId
                  : null,

              iglesiaNombre,
            }),
          }
        );

      const data =
        await respuesta.json();

      if (!respuesta.ok) {
        alert(
          data.error ||
            "Error creando usuario"
        );

        return;
      }

      alert(
        "Usuario creado correctamente"
      );

      setNombre("");
      setEmail("");
      setPassword("");

      setRol(
        "comunicador_iglesia"
      );

      setIglesiaId("");

      cargarUsuarios();

    } catch (error) {
      console.log(error);

      alert(
        "Error al crear usuario"
      );

    } finally {
      setLoading(false);
    }
  }

  async function cambiarEstado(
    id: string,
    estadoActual: boolean
  ) {
    try {
      const referencia =
        doc(
          db,
          "usuarios",
          id
        );

      await updateDoc(
        referencia,
        {
          activo:
            !estadoActual,
        }
      );

      cargarUsuarios();

    } catch (error) {
      console.log(error);

      alert(
        "Error actualizando usuario"
      );
    }
  }

  const usuariosFiltrados =
    usuarios.filter((usuario) =>
      `${usuario.nombre}
       ${usuario.email}
       ${usuario.rol}
       ${usuario.iglesiaNombre}`
        .toLowerCase()
        .includes(
          busqueda.toLowerCase()
        )
    );

  useEffect(() => {
    cargarUsuarios();
    cargarIglesias();
  }, []);

  return (
    <ProtegerRuta permiso="usuarios">
      <div className="space-y-8">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <span className="text-sm font-semibold text-[#2FAF86]">
                Área de Comunicaciones
              </span>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                Usuarios y Comunicadores
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 md:text-base">
                Gestión de accesos,
                comunicadores distritales,
                comunicadores por iglesia
                y administradores.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <MiniCard
                titulo="Usuarios"
                valor={usuarios.length}
                icono={
                  <Users size={18} />
                }
              />

              <MiniCard
                titulo="Activos"
                valor={
                  usuarios.filter(
                    (u) => u.activo
                  ).length
                }
                icono={
                  <CheckCircle2
                    size={18}
                  />
                }
              />

              <MiniCard
                titulo="Iglesias"
                valor={
                  usuarios.filter(
                    (u) =>
                      u.rol ===
                      "comunicador_iglesia"
                  ).length
                }
                icono={
                  <Church size={18} />
                }
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
          {/* FORM */}

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-[#44D7A8]/10 p-3 text-[#2FAF86]">
                <Plus size={22} />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  Crear acceso
                </h2>

                <p className="text-sm text-slate-500">
                  Registrar comunicador
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Nombre completo"
                placeholder="Ej. Mary Sánchez"
                value={nombre}
                onChange={setNombre}
              />

              <Input
                label="Correo electrónico"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={setEmail}
                type="email"
              />

              <Input
                label="Contraseña temporal"
                placeholder="******"
                value={password}
                onChange={setPassword}
                type="password"
              />

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Rol del usuario
                </label>

                <select
                  value={rol}
                  onChange={(e) => {
                    const nuevoRol =
                      e.target
                        .value as RolUsuario;

                    setRol(nuevoRol);

                    if (
                      nuevoRol !==
                      "comunicador_iglesia"
                    ) {
                      setIglesiaId("");
                    }
                  }}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-[#44D7A8]"
                >
                  {roles.map(
                    (item) => (
                      <option
                        key={
                          item.value
                        }
                        value={
                          item.value
                        }
                      >
                        {item.label}
                      </option>
                    )
                  )}
                </select>

                <p className="mt-2 text-xs text-slate-500">
                  {
                    rolSeleccionado?.descripcion
                  }
                </p>
              </div>

              {requiereIglesia && (
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Iglesia asignada
                  </label>

                  <select
                    value={
                      iglesiaId
                    }
                    onChange={(e) =>
                      setIglesiaId(
                        e.target.value
                      )
                    }
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-[#44D7A8]"
                  >
                    <option value="">
                      Seleccionar
                      iglesia
                    </option>

                    {iglesias.map(
                      (
                        iglesia
                      ) => (
                        <option
                          key={
                            iglesia.id
                          }
                          value={
                            iglesia.id
                          }
                        >
                          {iglesia.nombre ||
                            iglesia.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}

              <button
                onClick={
                  crearUsuarioReal
                }
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#111827] px-6 py-4 text-sm font-bold text-white transition hover:bg-black disabled:opacity-50"
              >
                <Plus size={18} />

                {loading
                  ? "Creando..."
                  : "Crear usuario"}
              </button>
            </div>
          </section>

          {/* LISTA */}

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  Lista de usuarios
                </h2>

                <p className="text-sm text-slate-500">
                  Comunicadores y accesos
                </p>
              </div>

              <div className="relative w-full lg:w-[340px]">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Buscar..."
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
              {usuariosFiltrados.map(
                (usuario) => (
                  <div
                    key={
                      usuario.id
                    }
                    className="flex flex-col gap-5 rounded-[24px] border border-slate-200 bg-slate-50/60 p-5 transition hover:border-[#44D7A8]/40 hover:bg-white hover:shadow-sm lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8fff4] text-[#16a36a]">
                        <UserRound
                          size={28}
                        />
                      </div>

                      <div>
                        <h3 className="text-lg font-black text-slate-900">
                          {
                            usuario.nombre
                          }
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge
                            icono={
                              <Mail
                                size={
                                  14
                                }
                              />
                            }
                            texto={
                              usuario.email
                            }
                          />

                          <Badge
                            icono={
                              <Shield
                                size={
                                  14
                                }
                              />
                            }
                            texto={formatearRol(
                              usuario.rol
                            )}
                          />

                          <Badge
                            icono={
                              <Church
                                size={
                                  14
                                }
                              />
                            }
                            texto={
                              usuario.iglesiaNombre ||
                              "Distrito CNB"
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-4 py-2 text-xs font-bold ${
                          usuario.activo
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {usuario.activo
                          ? "Activo"
                          : "Inactivo"}
                      </span>

                      <button
                        onClick={() =>
                          cambiarEstado(
                            usuario.id,
                            usuario.activo
                          )
                        }
                        className={`rounded-2xl px-5 py-3 text-sm font-bold text-white transition ${
                          usuario.activo
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-[#16a36a] hover:bg-[#128458]"
                        }`}
                      >
                        {usuario.activo
                          ? "Desactivar"
                          : "Activar"}
                      </button>
                    </div>
                  </div>
                )
              )}

              {usuariosFiltrados.length ===
                0 && (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm font-medium text-slate-500">
                  No se encontraron
                  usuarios
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
    </ProtegerRuta>
  );
}

function formatearRol(
  rol: string
) {
  const roles: Record<
    string,
    string
  > = {
    admin:
      "Administrador",

    pastor_distrital:
      "Pastor distrital",

    comunicador_distrital:
      "Comunicador distrital",

    comunicador_iglesia:
      "Comunicador de iglesia",
  };

  return (
    roles[rol] || rol
  );
}

function Input({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: any) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#44D7A8]"
      />
    </div>
  );
}

function Badge({
  icono,
  texto,
}: any) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
      {icono}
      {texto}
    </div>
  );
}

function MiniCard({
  titulo,
  valor,
  icono,
}: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="text-slate-500">
          {icono}
        </div>

        <p className="text-2xl font-black text-slate-900">
          {valor}
        </p>
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-600">
        {titulo}
      </p>
    </div>
  );
}