"use client";

import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/database.types";

// Define o tipo que usaremos
type PaymentMethod = Database['public']['Tables']['payment_methods']['Row'];

// Tipo para o formulário
type PaymentMethodFormData = {
  name: string;
};

export default function PaymentMethodsPage() {
  const supabase = createClient();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setPaymentMethods(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja deletar esta forma de pagamento?")) {
      return;
    }

    const { error } = await supabase.from("payment_methods").delete().eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      setPaymentMethods(paymentMethods.filter((m) => m.id !== id));
    }
  };

  const handleShowForm = (method: PaymentMethod | null = null) => {
    setEditingMethod(method);
    setShowForm(true);
  };

  const handleCloseForm = (needsReload: boolean) => {
    setShowForm(false);
    setEditingMethod(null);
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
      <PaymentMethodForm
        method={editingMethod}
        onClose={handleCloseForm}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Formas de Pagamento</h1>
        <button
          onClick={() => handleShowForm()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
        >
          Nova Forma de Pagamento
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paymentMethods.map((method) => (
              <tr key={method.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{method.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                  <button
                    onClick={() => handleShowForm(method)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(method.id)}
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

interface PaymentMethodFormProps {
  method: PaymentMethod | null;
  onClose: (needsReload: boolean) => void;
}

function PaymentMethodForm({ method, onClose }: PaymentMethodFormProps) {
  const supabase = createClient();
  const [formData, setFormData] = useState<PaymentMethodFormData>({
    name: method?.name || "",
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
      const payload: Database['public']['Tables']['payment_methods']['Insert'] = {
        name: formData.name,
      };

      let rpcError;

      if (method) {
        // --- UPDATE ---
        const { error } = await supabase
          .from("payment_methods")
          .update(payload)
          .eq("id", method.id);
        rpcError = error;
      } else {
        // --- CREATE ---
        const { error } = await supabase.from("payment_methods").insert(payload);
        rpcError = error;
      }

      if (rpcError) {
        throw rpcError;
      }

      onClose(true); // Sucesso, fechar e recarregar

    } catch (err: any) {
      if (err.message?.includes('duplicate key value violates unique constraint "payment_methods_name_key"')) {
        setError("Erro: Já existe uma forma de pagamento com este nome.");
      } else {
        setError(err.message || "Erro ao salvar a forma de pagamento.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        {method ? "Editar Forma de Pagamento" : "Nova Forma de Pagamento"}
      </h2>

      <form onSubmit={handleSubmit} className="p-8 bg-white shadow-md rounded-lg max-w-lg mx-auto">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
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
