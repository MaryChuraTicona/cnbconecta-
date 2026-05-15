"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const iniciarSesion = async () => {
    if (!email || !password) {
      alert("Escribe tu correo y contraseña");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      alert("Correo o contraseña incorrectos");
    }
  };

  return (
    <main className="min-h-screen bg-[#44D7A8] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-[#44D7A8] text-center mb-2">
          CNB Conecta+
        </h1>

        <p className="text-gray-500 text-center mb-8">
          Acceso al sistema distrital
        </p>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-lg p-3 w-full"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded-lg p-3 w-full"
          />

          <button
            onClick={iniciarSesion}
            className="bg-[#44D7A8] text-white w-full py-3 rounded-lg hover:bg-[#36b98f] transition"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    </main>
  );
}