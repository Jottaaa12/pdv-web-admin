"use client"; 

import { useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext"; // <-- Importar o hook
import { Database } from "@/lib/database.types";
import { useRouter } from "next/navigation"; // <-- Importar o Router

type UserProfile = Database['public']['Tables']['users']['Row'];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { setUser } = useAuth(); // <-- Usar o contexto
  const router = useRouter(); // <-- Inicializar o router

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "login_com_username_e_senha",
        { p_username: username, p_password: password }
      );

      if (rpcError) throw rpcError;

      if (data) {
        setUser(data as UserProfile); // <-- Salvar no contexto
        router.push("/dashboard"); // <-- Redirecionar para o Dashboard
      } else {
        setError("Usuário ou senha inválidos.");
      }
    } catch (err: any) {
      console.error("Erro no login:", err);
      setError(err.message || "Ocorreu um erro ao tentar fazer login.");
    } finally {
      setLoading(false);
    }
  };

  // O layout da página de login permanece o mesmo...
  // (O formulário HTML/Tailwind)
  return (
     <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <form
        onSubmit={handleLogin}
        className="p-8 bg-white shadow-md rounded-lg w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Login PDV Web
        </h1>

        <div className="mb-4">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700"
          >
            Usuário
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
        </div>

        {error && (
          <p className="mb-4 text-sm text-center text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}