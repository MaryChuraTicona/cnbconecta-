"use client";

import { useState } from "react";

import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  Mail,
  KeyRound,
  ArrowRight,
} from "lucide-react";

import {
  auth,
  db,
} from "@/lib/firebase";

import {
  useRouter,
} from "next/navigation";

export default function LoginPage() {

  const router =
    useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // LOGIN

  const iniciarSesion =
    async (
      e: React.FormEvent
    ) => {

      e.preventDefault();

      setLoading(true);

      setError("");

      try {

        const credenciales =
          await signInWithEmailAndPassword(
            auth,
            email,
            password
          );

        const usuario =
          credenciales.user;

        const refUsuario =
          doc(
            db,
            "usuarios",
            usuario.uid
          );

        const snapUsuario =
          await getDoc(
            refUsuario
          );

        if (
          !snapUsuario.exists()
        ) {

          await signOut(auth);

          setError(
            "Usuario no encontrado."
          );

          return;
        }

        const datos =
          snapUsuario.data();

        if (
          datos.activo === false
        ) {

          await signOut(auth);

          setError(
            "Usuario desactivado."
          );

          return;
        }

        router.push("/");

      } catch (error) {

        console.log(error);

        setError(
          "Correo o contraseña incorrectos."
        );

      } finally {

        setLoading(false);
      }
    };

  return (
    <main
      className="
        min-h-screen
        relative
        overflow-hidden
        bg-[#f7f8f7]
      "
    >

      {/* FONDO */}

      <div
        className="
          absolute
          top-[-200px]
          left-[-200px]
          w-[500px]
          h-[500px]
          bg-[#16a36a]/10
          rounded-full
          blur-3xl
        "
      />

      <div
        className="
          absolute
          bottom-[-250px]
          right-[-250px]
          w-[600px]
          h-[600px]
          bg-[#44D7A8]/10
          rounded-full
          blur-3xl
        "
      />

      {/* CONTENIDO */}

      <div
        className="
          relative
          z-10
          min-h-screen
          grid
          lg:grid-cols-2
        "
      >

        {/* IZQUIERDA */}

        <section
          className="
            hidden
            lg:flex
            items-center
            justify-center
            p-14
          "
        >

          <div
            className="
              max-w-2xl
            "
          >

            <img
              src="/logo-cnb-icono.png"
              alt="CNB Conecta+"
              className="
                w-full
                object-contain
              "
            />

            {/* VERSÍCULO */}

            <div
              className="
                mt-10
                bg-white/80
                backdrop-blur-xl
                border
                border-[#d9eee3]
                rounded-[32px]
                px-8
                py-7
                shadow-xl
              "
            >

              <p
                className="
                  text-[22px]
                  leading-relaxed
                  italic
                  text-[#1f2937]
                "
              >
                “Id por todo el mundo y
                predicad el evangelio
                a toda criatura.”
              </p>

              <p
                className="
                  mt-4
                  text-[#16a36a]
                  font-bold
                  text-lg
                  text-right
                "
              >
                Marcos 16:15
              </p>

            </div>

          </div>

        </section>

        {/* DERECHA */}

        <section
          className="
            flex
            items-center
            justify-center
            px-6
            py-10
          "
        >

          <div
            className="
              w-full
              max-w-md
            "
          >

            {/* LOGO MÓVIL */}

            <div
              className="
                lg:hidden
                text-center
                mb-10
              "
            >

              <img
                src="/logo-cnb-icono.png"
                alt="CNB"
                className="
                  w-28
                  h-28
                  mx-auto
                  object-contain
                "
              />

              <img
                src="/logo-cnb-texto.png"
                alt="CNB"
                className="
                  w-72
                  mx-auto
                  mt-3
                  object-contain
                "
              />

            </div>

            {/* CARD */}

            <div
              className="
                bg-white/85
                backdrop-blur-2xl
                border
                border-white
                rounded-[40px]
                shadow-[0_20px_60px_rgba(0,0,0,0.08)]
                p-10
              "
            >

              {/* TITULO */}

              <div
                className="
                  mb-10
                "
              >

                <h1
                  className="
                    text-5xl
                    font-black
                    tracking-tight
                    text-[#111827]
                  "
                >
                  Bienvenido
                </h1>

                <p
                  className="
                    mt-3
                    text-gray-500
                    text-lg
                  "
                >
                  Accede a tu plataforma distrital.
                </p>

              </div>

              {/* FORM */}

              <form
                onSubmit={
                  iniciarSesion
                }
                className="
                  space-y-6
                "
              >

                {/* EMAIL */}

                <div>

                  <label
                    className="
                      block
                      text-sm
                      font-semibold
                      text-gray-700
                      mb-3
                    "
                  >
                    Correo electrónico
                  </label>

                  <div
                    className="
                      relative
                    "
                  >

                    <Mail
                      size={19}
                      className="
                        absolute
                        left-4
                        top-1/2
                        -translate-y-1/2
                        text-gray-400
                      "
                    />

                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) =>
                        setEmail(
                          e.target.value
                        )
                      }
                      placeholder="usuario@cnb.com"
                      className="
                        w-full
                        rounded-2xl
                        border
                        border-gray-200
                        bg-white
                        pl-12
                        pr-4
                        py-4
                        text-[15px]
                        outline-none
                        focus:ring-2
                        focus:ring-[#16a36a]
                        focus:border-transparent
                        transition-all
                      "
                    />

                  </div>

                </div>

                {/* PASSWORD */}

                <div>

                  <label
                    className="
                      block
                      text-sm
                      font-semibold
                      text-gray-700
                      mb-3
                    "
                  >
                    Contraseña
                  </label>

                  <div
                    className="
                      relative
                    "
                  >

                    <KeyRound
                      size={19}
                      className="
                        absolute
                        left-4
                        top-1/2
                        -translate-y-1/2
                        text-gray-400
                      "
                    />

                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) =>
                        setPassword(
                          e.target.value
                        )
                      }
                      placeholder="********"
                      className="
                        w-full
                        rounded-2xl
                        border
                        border-gray-200
                        bg-white
                        pl-12
                        pr-4
                        py-4
                        text-[15px]
                        outline-none
                        focus:ring-2
                        focus:ring-[#16a36a]
                        focus:border-transparent
                        transition-all
                      "
                    />

                  </div>

                </div>

                {/* ERROR */}

                {error && (

                  <div
                    className="
                      bg-red-50
                      border
                      border-red-100
                      text-red-600
                      rounded-2xl
                      p-4
                      text-sm
                    "
                  >
                    {error}
                  </div>

                )}

                {/* BOTÓN */}

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full
                    bg-[#111827]
                    hover:bg-black
                    transition-all
                    text-white
                    rounded-2xl
                    py-4
                    font-semibold
                    text-lg
                    flex
                    items-center
                    justify-center
                    gap-2
                  "
                >

                  {loading
                    ? "Ingresando..."
                    : "Ingresar"}

                  <ArrowRight size={20} />

                </button>

              </form>

              {/* FOOTER */}

              <div
                className="
                  mt-10
                  pt-6
                  border-t
                  text-center
                "
              >

                <p
                  className="
                    text-sm
                    text-gray-400
                  "
                >
                  © 2026 CNB Conecta+
                </p>

              </div>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}