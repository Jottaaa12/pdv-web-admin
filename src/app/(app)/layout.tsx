"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, setUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Proteção de Rota: Se não houver usuário, redireciona para o login.
    // Damos um tempo para o AuthContext carregar (em um app real,
    // o AuthProvider faria isso de forma mais robusta).
    if (user === null) {
       // A IA-Web pode adicionar um estado 'loading' no AuthContext
       // para evitar o piscar da tela, mas por enquanto:
       console.log("Usuário não encontrado, redirecionando para login...");
       router.push("/");
    }
  }, [user, router]);

  const handleLogout = () => {
    setUser(null);
    // (Em um app real, chamaríamos supabase.auth.signOut())
    router.push("/");
  };

  // Se o usuário ainda não foi carregado, mostre um loading
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Carregando...
      </div>
    );
  }

  // Usuário está logado, mostrar o layout do app
  return (
    <div className="flex min-h-screen">
      {/* Barra Lateral */}
      <aside className="w-64 bg-gray-800 text-white p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-8">PDV Admin</h2>
        <nav className="flex flex-col gap-4">
          <Link href="/dashboard" className="text-lg hover:text-blue-300">
            Dashboard
          </Link>
          <Link href="/products" className="text-lg hover:text-blue-300">
            Produtos
          </Link>
          <Link href="/customers" className="text-lg hover:text-blue-300">
            Clientes
          </Link>
          <Link href="/sales" className="text-lg hover:text-blue-300">
            Histórico de Vendas {/* <-- ADICIONAR */}
          </Link>
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="mt-auto">
          <p className="text-sm text-gray-400">Logado como:</p>
          <p className="font-medium">{user.username} ({user.role})</p>
          <button
            onClick={handleLogout}
            className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo da Página */}
      <main className="flex-1 p-8 bg-gray-100">
        {children}
      </main>
    </div>
  );
}