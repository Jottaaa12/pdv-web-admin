"use client";

import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/database.types";

// Define o tipo que usaremos
type ProductGroup = Database['public']['Tables']['product_groups']['Row'];

// Tipo para o formulário
type ProductGroupFormData = {
  name: string;
};

export default function ProductGroupsPage() {
  const supabase = createClient();
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ProductGroup | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("product_groups")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setProductGroups(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja deletar este grupo? Produtos associados a ele perderão a categoria.")) {
      return;
    }

    const { error } = await supabase.from("product_groups").delete().eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      setProductGroups(productGroups.filter((g) => g.id !== id));
    }
  };

  const handleShowForm = (group: ProductGroup | null = null) => {
    setEditingGroup(group);
    setShowForm(true);
  };

  const handleCloseForm = (needsReload: boolean) => {
    setShowForm(false);
    setEditingGroup(null);
    if (needsReload) {
      fetchData();
    }
  };

  if (loading) {
    return <div>Carregando dados...</div>;
  }

  if (error) {
    return <div className="text-red-500">Erro: {error}</div>;
  }

  if (showForm) {
    return (
      <ProductGroupForm
        group={editingGroup}
        onClose={handleCloseForm}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Grupos de Produtos</h1>
        <button
          onClick={() => handleShowForm()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
        >
          Novo Grupo
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome do Grupo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productGroups.map((group) => (
              <tr key={group.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{group.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                  <button
                    onClick={() => handleShowForm(group)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Deletar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Componente do Formulário ---

interface ProductGroupFormProps {
  group: ProductGroup | null;
  onClose: (needsReload: boolean) => void;
}

function ProductGroupForm({ group, onClose }: ProductGroupFormProps) {
  const supabase = createClient();
  const [formData, setFormData] = useState<ProductGroupFormData>({
    name: group?.name || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: Database['public']['Tables']['product_groups']['Insert'] = {
        name: formData.name,
      };

      let rpcError;

      if (group) {
        // --- UPDATE ---
        const { error } = await supabase
          .from("product_groups")
          .update(payload)
          .eq("id", group.id);
        rpcError = error;
      } else {
        // --- CREATE ---
        const { error } = await supabase.from("product_groups").insert(payload);
        rpcError = error;
      }

      if (rpcError) {
        throw rpcError;
      }

      onClose(true); // Sucesso, fechar e recarregar

    } catch (err: any) {
      if (err.message?.includes('duplicate key value violates unique constraint "product_groups_name_key"')) {
        setError("Erro: Já existe um grupo com este nome.");
      } else {
        setError(err.message || "Erro ao salvar o grupo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        {group ? "Editar Grupo" : "Novo Grupo"}
      </h2>

      <form onSubmit={handleSubmit} className="p-8 bg-white shadow-md rounded-lg max-w-lg mx-auto">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Grupo</label>
          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full input-text" />
        </div>

        {error && (
          <p className="my-4 text-sm text-center text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-4 mt-6">
          <button type="button" onClick={() => onClose(false)} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? "Salvando..." : "Salvar"}</button>
        </div>
      </form>
    </div>
  );
}
