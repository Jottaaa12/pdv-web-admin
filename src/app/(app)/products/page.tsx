"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/database.types";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

// Define os tipos que usaremos (baseados no database.types.ts)
type Product = Database['public']['Tables']['products']['Row'];
type ProductGroup = Database['public']['Tables']['product_groups']['Row'];

// Tipo combinado para facilitar a exibição
type ProductWithGroup = Product & {
  product_groups: { name: string } | null;
};

export default function ProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [products, setProducts] = useState<ProductWithGroup[]>([]);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para o formulário (criar/editar)
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Função para formatar centavos para R$
  const formatCurrency = (value: number | null) => {
    if (value === null) return "R$ 0,00";
    return (value / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Função para carregar dados
  async function fetchData() {
    setLoading(true);
    setError(null);

    // 1. Carregar Grupos
    const { data: groupsData, error: groupsError } = await supabase
      .from("product_groups")
      .select("*");

    if (groupsError) {
      setError(groupsError.message);
    } else {
      setGroups(groupsData || []);
    }

    // 2. Carregar Produtos (com JOIN para nome do grupo)
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select(`
        *,
        product_groups ( name )
      `)
      .order("description", { ascending: true });

    if (productsError) {
      setError(productsError.message);
    } else {
      setProducts(productsData as ProductWithGroup[] || []);
    }

    setLoading(false);
  }

  // Carregar dados na montagem do componente
  useEffect(() => {
    // Simples proteção de rota do lado do cliente
    if (!user && process.env.NODE_ENV === 'production') {
       // (A IA-Web deve implementar um layout de proteção melhor)
      // router.push("/"); 
    }
    fetchData();
  }, [user, router]); // Recarrega se o usuário mudar

  // Função de Deletar
  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja deletar este produto?")) {
      return;
    }

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      // Remove o produto da lista local
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  // Funções para abrir/fechar formulário
  const handleShowForm = (product: Product | null = null) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleCloseForm = (needsReload: boolean) => {
    setShowForm(false);
    setEditingProduct(null);
    if (needsReload) {
      fetchData(); // Recarrega os dados se um item foi salvo
    }
  };

  // --- Renderização ---

  if (loading) {
    return <div className="p-8">Carregando dados...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Erro: {error}</div>;
  }

  // Se o formulário estiver aberto, mostre-o
  if (showForm) {
    return (
      <ProductForm
        product={editingProduct}
        groups={groups}
        onClose={handleCloseForm}
      />
    );
  }

  // Senão, mostre a tabela
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Produtos</h1>
        <button
          onClick={() => handleShowForm()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
        >
          Novo Produto
        </button>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grupo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cód. Barras</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo Venda</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.product_groups?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.barcode || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(product.price)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sale_type === 'unit' ? 'Unidade' : 'Peso'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                  <button
                    onClick={() => handleShowForm(product)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
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

// --- Componente do Formulário (no mesmo arquivo para simplificar) ---

interface ProductFormProps {
  product: Product | null;
  groups: ProductGroup[];
  onClose: (needsReload: boolean) => void;
}

// Tipo para o formulário (precisamos de strings para os inputs)
type ProductFormData = {
  description: string;
  barcode: string;
  price: string; // Preço em R$ (ex: "10,50")
  stock: string; // Estoque como string
  sale_type: 'unit' | 'weight';
  group_id: string; // ID do grupo como string
};

function ProductForm({ product, groups, onClose }: ProductFormProps) {
  const supabase = createClient();
  const [formData, setFormData] = useState<ProductFormData>({
    description: product?.description || "",
    barcode: product?.barcode || "",
    // Formata centavos para R$
    price: product ? (product.price / 100).toFixed(2).replace(".", ",") : "0,00",
    stock: product?.stock?.toString() || "0",
    sale_type: product?.sale_type || "unit",
    group_id: product?.group_id?.toString() || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Converter dados do formulário para o formato do Supabase

      // Converte preço (ex: "10,50") para centavos (ex: 1050)
      const priceInCents = Math.round(parseFloat(formData.price.replace(".", "").replace(",", ".")) * 100);
      const stockAmount = parseInt(formData.stock, 10);

      if (isNaN(priceInCents)) {
        throw new Error("Formato de preço inválido. Use 10,50.");
      }
      if (isNaN(stockAmount)) {
        throw new Error("O estoque deve ser um número válido.");
      }

      const payload: Database['public']['Tables']['products']['Insert'] = {
        description: formData.description,
        barcode: formData.barcode || null,
        price: priceInCents,
        stock: stockAmount,
        sale_type: formData.sale_type,
        group_id: formData.group_id ? parseInt(formData.group_id) : null,
      };

      let rpcError;

      if (product) {
        // --- UPDATE ---
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", product.id);
        rpcError = error;
      } else {
        // --- CREATE ---
        const { error } = await supabase.from("products").insert(payload);
        rpcError = error;
      }

      if (rpcError) {
        throw rpcError;
      }

      onClose(true); // Sucesso, fechar e recarregar

    } catch (err: any) {
      setError(err.message || "Erro ao salvar produto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">
        {product ? "Editar Produto" : "Novo Produto"}
      </h2>

      <form onSubmit={handleSubmit} className="p-8 bg-white shadow-md rounded-lg max-w-2xl mx-auto">
        {/* Campo Descrição */}
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
          <input
            type="text"
            name="description"
            id="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
          />
        </div>

        {/* Campo Preço */}
        <div className="mb-4">
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">Preço (R$)</label>
          <input
            type="text"
            name="price"
            id="price"
            value={formData.price}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
          />
        </div>

        {/* Campo Estoque */}
        <div className="mb-4">
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Estoque Atual</label>
          <input
            type="number"
            name="stock"
            id="stock"
            value={formData.stock}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
          />
        </div>

        {/* Campo Cód. Barras */}
        <div className="mb-4">
          <label htmlFor="barcode" className="block text-sm font-medium text-gray-700">Cód. Barras</label>
          <input
            type="text"
            name="barcode"
            id="barcode"
            value={formData.barcode}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
          />
        </div>

        {/* Campo Grupo */}
        <div className="mb-4">
          <label htmlFor="group_id" className="block text-sm font-medium text-gray-700">Grupo</label>
          <select
            name="group_id"
            id="group_id"
            value={formData.group_id}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
          >
            <option value="">Nenhum</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id.toString()}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        {/* Campo Tipo de Venda */}
        <div className="mb-4">
          <label htmlFor="sale_type" className="block text-sm font-medium text-gray-700">Tipo de Venda</label>
          <select
            name="sale_type"
            id="sale_type"
            value={formData.sale_type}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
          >
            <option value="unit">Unidade</option>
            <option value="weight">Peso</option>
          </select>
        </div>

        {error && (
          <p className="my-4 text-sm text-center text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}