"use client";

import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

// --- Componente do Ícone (para o menu retrátil) ---
const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={`w-5 h-5 transition-transform transform ${isOpen ? "rotate-180" : ""}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
  </svg>
);

// --- Componente do Item de Menu Retrátil ---
interface CollapsibleMenuProps {
  title: string;
  icon: string;
  children: ReactNode;
}

const CollapsibleMenu = ({ title, icon, children }: CollapsibleMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-lg text-left hover:text-blue-300 focus:outline-none"
      >
        <span className="flex items-center gap-2">
          <span>{icon}</span>
          <span>{title}</span>
        </span>
        <ChevronIcon isOpen={isOpen} />
      </button>
      {isOpen && <div className="pl-6 mt-2 flex flex-col gap-2">{children}</div>}
    </div>
  );
};

// --- Layout Principal ---
export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Só redireciona se o carregamento terminou e não há usuário
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);

  // Mostra "Carregando..." enquanto o estado de auth é verificado ou antes do redirect
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        Carregando...
      </div>
    );
  }

  // Se chegou aqui, o usuário está carregado e logado.
  return (
    <div className="flex min-h-screen">
      {/* Barra Lateral */}
      <aside className="w-72 bg-gray-800 text-white p-6 flex flex-col shadow-lg">
        <h2 className="text-2xl font-bold mb-8 text-center">PDV Admin</h2>
        
        <nav className="flex flex-col gap-4">
          {/* Dashboard */}
          <Link href="/dashboard" className="flex items-center gap-2 text-lg hover:text-blue-300">
            <span>📊</span>
            <span>Dashboard</span>
          </Link>

          {/* Gestão de Usuários */}
          <CollapsibleMenu title="Gestão de Usuários" icon="👥">
            <Link href="/users" className="hover:text-blue-300">👤 Usuários do Sistema</Link>
            <Link href="/user-sessions" className="hover:text-blue-300">⏰ Sessões de Usuário</Link>
            <Link href="/audit-logs" className="hover:text-blue-300">📋 Logs de Auditoria</Link>
          </CollapsibleMenu>

          {/* Operações do PDV */}
          <CollapsibleMenu title="Operações do PDV" icon="🏪">
            <CollapsibleMenu title="Controle de Caixa" icon="💰">
                <Link href="/cash-sessions" className="hover:text-blue-300">📂 Sessões de Caixa</Link>
                <Link href="/cash-movements" className="hover:text-blue-300">💸 Movimentações</Link>
            </CollapsibleMenu>
            <CollapsibleMenu title="Produtos" icon="🛒">
                <Link href="/products" className="hover:text-blue-300">📦 Produtos</Link>
                <Link href="/product-groups" className="hover:text-blue-300">🏷️ Grupos de Produtos</Link>
            </CollapsibleMenu>
            <CollapsibleMenu title="Clientes" icon="👥">
                <Link href="/customers" className="hover:text-blue-300">👤 Clientes</Link>
                <Link href="/credits" className="hover:text-blue-300">💳 Créditos/Fiados</Link>
            </CollapsibleMenu>
             <CollapsibleMenu title="Vendas" icon="📋">
                <Link href="/sales" className="hover:text-blue-300">📜 Histórico de Vendas</Link>
            </CollapsibleMenu>
          </CollapsibleMenu>

          {/* Estoque Geral */}
          <CollapsibleMenu title="Estoque Geral" icon="📦">
            <Link href="/inventory-groups" className="hover:text-blue-300">📁 Grupos de Estoque</Link>
            <Link href="/inventory-items" className="hover:text-blue-300">📦 Itens de Estoque</Link>
            <Link href="/stock-control" className="hover:text-blue-300">📊 Movimentações de Estoque</Link>
          </CollapsibleMenu>

          {/* Configurações */}
          <CollapsibleMenu title="Configurações" icon="⚙️">
            <Link href="/payment-methods" className="hover:text-blue-300">💳 Métodos de Pagamento</Link>
            <Link href="#" className="hover:text-blue-300 text-gray-500">🏢 Configurações do Sistema</Link>
          </CollapsibleMenu>
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="mt-auto">
          <div className="border-t border-gray-700 pt-4">
             <p className="text-sm text-gray-400">Logado como:</p>
             <p className="font-medium">{user.username} ({user.role})</p>
             <button
                onClick={logout}
                className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
             >
                Sair
             </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo da Página */}
      <main className="flex-1 p-8 bg-gray-100 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}