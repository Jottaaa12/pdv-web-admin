"use client";

import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/database.types";

// Tipos
type User = Omit<Database['public']['Tables']['users']['Row'], 'password_hash'>;

export default function UsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);

    // Seleciona todos os campos, exceto o hash da senha por segurança
    const { data, error } = await supabase
      .from("users")
      .select("id, username, role, active, created_at")
      .order("username", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setUsers(data as User[] || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleShowForm = (user: User | null = null) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleCloseForm = (needsReload: boolean) => {
    setShowForm(false);
    setEditingUser(null);
    if (needsReload) {
      fetchData();
    }
  };

  // --- Renderização ---

  if (loading) {
    return <div>Carregando dados...</div>;
  }

  if (error) {
    return <div className="text-red-500">Erro: {error}</div>;
  }

  if (showForm) {
    return (
      <UserForm
        user={editingUser}
        onClose={handleCloseForm}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Usuários do Sistema</h1>
        <button
          onClick={() => handleShowForm()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
        >
          Novo Usuário
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissão</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {user.active ? (
                     <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Ativo</span>
                  ) : (
                     <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Inativo</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                  <button
                    onClick={() => handleShowForm(user)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Editar
                  </button>
                  {/* A IA-Web irá implementar a lógica de desativar/ativar aqui */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Componente do Formulário (Lógica de salvar ainda não implementada) ---

interface UserFormProps {
  user: User | null;
  onClose: (needsReload: boolean) => void;
}

function UserForm({ user, onClose }: UserFormProps) {
  const [formData, setFormData] = useState({
    username: user?.username || "",
    role: user?.role || "operador",
    active: user?.active ?? true,
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
       setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
       setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não conferem.");
      setLoading(false);
      return;
    }
    
    if (user === null && !formData.password) {
        setError("A senha é obrigatória para novos usuários.");
        setLoading(false);
        return;
    }

    try {
      const supabase = createClient();
      const userRecord = {
        id: user?.id,
        username: formData.username,
        role: formData.role,
        active: formData.active,
        password: formData.password || undefined, // Envia undefined se a senha for vazia
      };

      const { data, error } = await supabase.functions.invoke("set-user", {
        body: { userRecord },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Sucesso!
      onClose(true); // Fecha o formulário e recarrega a lista

    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao salvar o usuário.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        {user ? "Editar Usuário" : "Novo Usuário"}
      </h2>

      <form onSubmit={handleSubmit} className="p-8 bg-white shadow-md rounded-lg max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Username */}
        <div className="md:col-span-2">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">Nome de Usuário</label>
          <input type="text" name="username" id="username" value={formData.username} onChange={handleChange} required className="mt-1 block w-full input-text" />
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">Permissão</label>
          <select name="role" id="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full input-text">
            <option value="operador">Operador</option>
            <option value="gerente">Gerente</option>
          </select>
        </div>

        {/* Active */}
        <div className="flex items-center justify-center">
          <input type="checkbox" name="active" id="active" checked={formData.active} onChange={handleChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
          <label htmlFor="active" className="ml-2 block text-sm font-medium text-gray-700">Usuário Ativo?</label>
        </div>

        {/* Password */}
        <div className="md:col-span-2 border-t pt-6 mt-2">
            <p className="text-sm text-gray-600 mb-2">{user ? "Preencha somente se desejar alterar a senha." : "Defina a senha para o novo usuário."}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
                    <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} className="mt-1 block w-full input-text" />
                </div>
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
                    <input type="password" name="confirmPassword" id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="mt-1 block w-full input-text" />
                </div>
            </div>
        </div>

        {error && (
          <p className="md:col-span-2 my-2 text-sm text-center text-red-600">{error}</p>
        )}

        <div className="md:col-span-2 flex justify-end gap-4 mt-4">
          <button type="button" onClick={() => onClose(false)} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? "Salvando..." : "Salvar"}</button>
        </div>
      </form>
    </div>
  );
}
