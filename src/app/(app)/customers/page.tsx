"use client";

import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/database.types";

// Define os tipos que usaremos
type Customer = Database['public']['Tables']['customers']['Row'];

// Tipo para o formulário (inputs são strings)
type CustomerFormData = {
  name: string;
  cpf: string;
  phone: string;
  address: string;
  credit_limit: string; // Limite em R$ (ex: "100,00")
  is_blocked: boolean;
};

// Função para formatar centavos para R$
const formatCurrency = (value: number | null) => {
  if (value === null) return "R$ 0,00";
  return (value / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

export default function CustomersPage() {
  const supabase = createClient();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setCustomers(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja deletar este cliente?")) {
      return;
    }

    const { error } = await supabase.from("customers").delete().eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      setCustomers(customers.filter((c) => c.id !== id));
    }
  };

  const handleShowForm = (customer: Customer | null = null) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleCloseForm = (needsReload: boolean) => {
    setShowForm(false);
    setEditingCustomer(null);
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
      <CustomerForm
        customer={editingCustomer}
        onClose={handleCloseForm}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
        <button
          onClick={() => handleShowForm()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
        >
          Novo Cliente
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPF</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Limite (Fiado)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.cpf || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(customer.credit_limit)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {customer.is_blocked ? (
                     <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Bloqueado</span>
                  ) : (
                     <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Ativo</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                  <button
                    onClick={() => handleShowForm(customer)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
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

interface CustomerFormProps {
  customer: Customer | null;
  onClose: (needsReload: boolean) => void;
}

function CustomerForm({ customer, onClose }: CustomerFormProps) {
  const supabase = createClient();
  const [formData, setFormData] = useState<CustomerFormData>({
    name: customer?.name || "",
    cpf: customer?.cpf || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
    credit_limit: customer ? (customer.credit_limit / 100).toFixed(2).replace(".", ",") : "0,00",
    is_blocked: customer?.is_blocked || false,
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
    setLoading(true);
    setError(null);

    try {
      const creditLimitInCents = Math.round(parseFloat(formData.credit_limit.replace(".", "").replace(",", ".")) * 100);

      if (isNaN(creditLimitInCents)) {
        throw new Error("Formato de limite inválido. Use 100,00.");
      }

      const payload: Database['public']['Tables']['customers']['Insert'] = {
        name: formData.name,
        cpf: formData.cpf || null,
        phone: formData.phone || null,
        address: formData.address || null,
        credit_limit: creditLimitInCents,
        is_blocked: formData.is_blocked,
      };

      let rpcError;

      if (customer) {
        // --- UPDATE ---
        const { error } = await supabase
          .from("customers")
          .update(payload)
          .eq("id", customer.id);
        rpcError = error;
      }
       else {
        // --- CREATE ---
        const { error } = await supabase.from("customers").insert(payload);
        rpcError = error;
      }

      if (rpcError) {
        throw rpcError;
      }

      onClose(true); // Sucesso, fechar e recarregar

    } catch (err: any) {
      // Tratar erro de CPF duplicado
      if (err.message?.includes('duplicate key value violates unique constraint "customers_cpf_key"')) {
        setError("Erro: Já existe um cliente com este CPF.");
      } else {
        setError(err.message || "Erro ao salvar cliente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        {customer ? "Editar Cliente" : "Novo Cliente"}
      </h2>

      <form onSubmit={handleSubmit} className="p-8 bg-white shadow-md rounded-lg max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nome */}
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Completo</label>
          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full input-text" />
        </div>

        {/* CPF */}
        <div>
          <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">CPF</label>
          <input type="text" name="cpf" id="cpf" value={formData.cpf} onChange={handleChange} className="mt-1 block w-full input-text" />
        </div>

        {/* Telefone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
          <input type="text" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full input-text" />
        </div>

        {/* Endereço */}
        <div className="md:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Endereço</label>
          <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full input-text" />
        </div>

        {/* Limite de Crédito */}
        <div>
          <label htmlFor="credit_limit" className="block text-sm font-medium text-gray-700">Limite de Crédito (R$)</label>
          <input type="text" name="credit_limit" id="credit_limit" value={formData.credit_limit} onChange={handleChange} className="mt-1 block w-full input-text" />
        </div>

         {/* Bloqueado */}
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            name="is_blocked"
            id="is_blocked"
            checked={formData.is_blocked}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="is_blocked" className="ml-2 block text-sm font-medium text-gray-700">Cliente Bloqueado?</label>
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