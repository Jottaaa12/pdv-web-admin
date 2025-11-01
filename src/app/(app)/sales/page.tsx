"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/database.types";

// --- Tipos de Dados ---
type SaleWithUser = Database['public']['Tables']['sales']['Row'] & {
  users: { username: string } | null;
  // Adicionaremos os itens quando o modal for aberto
  sale_items?: SaleItemWithProduct[];
};

type SaleItemWithProduct = Database['public']['Tables']['sale_items']['Row'] & {
  products: { description: string } | null;
};

// --- Funções Helper (Formatadores) ---
const formatCurrency = (value: number | null) => {
  if (value === null) return "R$ 0,00";
  return (value / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("pt-BR", {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const ITEMS_PER_PAGE = 20;

export default function SalesHistoryPage() {
  const supabase = createClient();
  const [sales, setSales] = useState<SaleWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0); // Página atual (começa em 0)
  const [totalCount, setTotalCount] = useState(0); // Total de vendas no DB

  // Estado do Modal
  const [selectedSale, setSelectedSale] = useState<SaleWithUser | null>(null);
  const [loadingModal, setLoadingModal] = useState(false);

  async function fetchData(pageIndex: number) {
    setLoading(true);
    setError(null);

    const from = pageIndex * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      // Busca as vendas paginadas, com contagem total
      const { data, error, count } = await supabase
        .from("sales")
        .select(`
          *,
          users ( username )
        `, { count: 'exact' }) // 'exact' nos dá o total de linhas
        .eq("training_mode", false)
        .order("sale_date", { ascending: false })
        .range(from, to); // Paginação

      if (error) throw error;

      setSales(data as SaleWithUser[] || []);
      setTotalCount(count || 0);

    } catch (err: any) {
      setError(err.message || "Erro ao carregar histórico de vendas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData(page);
  }, [page]); // Recarrega quando a 'page' mudar

  // --- Funções do Modal ---
  const handleViewDetails = async (sale: SaleWithUser) => {
    setLoadingModal(true);
    setSelectedSale(sale); // Abre o modal (modo loading)

    // Busca os itens desta venda específica
    const { data: itemsData, error: itemsError } = await supabase
      .from("sale_items")
      .select(`
        *,
        products ( description )
      `)
      .eq("sale_id", sale.id);

    if (itemsError) {
      setError("Erro ao buscar itens da venda: " + itemsError.message);
      setSelectedSale(null); // Fecha o modal em caso de erro
    } else {
      // Adiciona os itens à venda selecionada e desliga o loading
      setSelectedSale({ ...sale, sale_items: itemsData as SaleItemWithProduct[] });
    }
    setLoadingModal(false);
  };

  const handleCloseModal = () => {
    setSelectedSale(null);
  };

  // --- Funções de Paginação ---
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const goToNextPage = () => {
    if (page < totalPages - 1) {
      setPage(page + 1);
    }
  };

  const goToPrevPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  // --- Renderização ---

  if (loading && !selectedSale) { // Não mostrar loading de página inteira se o modal estiver abrindo
    return <div>Carregando histórico...</div>;
  }

  if (error) {
    return <div className="text-red-500">Erro: {error}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Histórico de Vendas</h1>

      {/* Tabela de Vendas */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operador</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(sale.sale_date)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sale.users?.username || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-bold">{formatCurrency(sale.total_amount)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                  <button
                    onClick={() => handleViewDetails(sale)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Ver Detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Controles de Paginação */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={goToPrevPage}
          disabled={page === 0 || loading}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-sm text-gray-700">
          Página {page + 1} de {totalPages} (Total: {totalCount} vendas)
        </span>
        <button
          onClick={goToNextPage}
          disabled={page >= totalPages - 1 || loading}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded disabled:opacity-50"
        >
          Próxima
        </button>
      </div>

      {/* O Modal (renderização condicional) */}
      {selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          isLoading={loadingModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}


// --- Componente do Modal (no mesmo arquivo para simplificar) ---

interface SaleDetailModalProps {
  sale: SaleWithUser;
  isLoading: boolean;
  onClose: () => void;
}

function SaleDetailModal({ sale, isLoading, onClose }: SaleDetailModalProps) {
  return (
    // Fundo (Backdrop)
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center"
      onClick={onClose} // Fecha ao clicar fora
    >
      {/* Conteúdo do Modal */}
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 z-50"
        onClick={(e) => e.stopPropagation()} // Impede de fechar ao clicar dentro
      >
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Detalhes da Venda #{sale.id}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>

        {isLoading ? (
          <div>Carregando itens...</div>
        ) : (
          <div>
            {/* Informações da Venda */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Data</p>
                <p className="font-medium text-gray-900">{formatDate(sale.sale_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Operador</p>
                <p className="font-medium text-gray-900">{sale.users?.username || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Valor Total</p>
                <p className="font-medium text-gray-900 text-lg">{formatCurrency(sale.total_amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Troco</p>
                <p className="font-medium text-gray-900">{formatCurrency(sale.change_amount)}</p>
              </div>
            </div>

            {/* Tabela de Itens */}
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Itens Vendidos</h3>
            <div className="border rounded-lg overflow-hidden">
               <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qtd.</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Preço Unit.</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sale.sale_items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.products?.description || 'Produto Deletado'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">{formatCurrency(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
               </table>
            </div>
          </div>
        )}

        <div className="text-right mt-6">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
