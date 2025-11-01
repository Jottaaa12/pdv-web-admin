"use client";

import { createContext, useContext, useState, ReactNode, SetStateAction, Dispatch } from "react";
import { Database } from "@/lib/database.types"; // Importa os tipos gerados

// Define o tipo do nosso usuário (da tabela public.users)
type UserProfile = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: UserProfile | null;
  setUser: Dispatch<SetStateAction<UserProfile | null>>;
  // (Poderíamos adicionar login/logout aqui, mas manteremos simples por enquanto)
}

// Cria o contexto com um valor padrão
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cria o "Provedor" do contexto
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook customizado para facilitar o uso do contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}