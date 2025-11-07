"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/database.types";

// Tipo para os KPIs retornados pela função RPC
type DashboardKPIs = {
  total_faturamento: number;
  total_vendas: number;
  ticket_medio: number;
};

// Tipo para a Venda (com nome do usuário)
type SaleWithUser = Database['public']['Tables']['sales']['Row'] & {
  users: { username: string } | null;
};

// Função para formatar centavos para R$
const formatCurrency = (value: number | null) => {
  if (value === null) return "R$ 0,00";
  // O valor já vem como centavos (bigint)
  return (value / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

// Função para formatar datas
const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("pt-BR", {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export default function DashboardPage() {
  const supabase = createClient();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [latestSales, setLatestSales] = useState<SaleWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchDashboardData() {
    setLoading(true);
    setError(null);

    try {
      // 1. Chamar a função RPC para os KPIs
      const { data: kpiData, error: kpiError } = await supabase.rpc(
        "get_dashboard_kpis"
      );
      if (kpiError) throw kpiError;
      setKpis(kpiData);

      // 2. Buscar as últimas 10 vendas (com JOIN no usuário)
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select(`
          *,
          users ( username )
        `)
        .eq("training_mode", false)
        .order("sale_date", { ascending: false })
        .limit(10);

      if (salesError) throw salesError;
      setLatestSales(salesData as SaleWithUser[] || []);

    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados do dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div>Carregando dashboard...</div>;
  }

  if (error) {
    return <div className="text-red-500">Erro: {error}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard (Hoje)</h1>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card Faturamento */}
        <KpiCard
          title="Faturamento Total (Hoje)"
          value={formatCurrency(kpis?.total_faturamento ?? null)}
          icon="💰"
        />
        {/* Card Vendas */}
        <KpiCard
          title="Total de Vendas (Hoje)"
          value={(kpis?.total_vendas ?? 0).toString()}
          icon="🛒"
        />
        {/* Card Ticket Médio */}
        <KpiCard
          title="Ticket Médio (Hoje)"
          value={formatCurrency(kpis?.ticket_medio ?? null)}
          icon="📊"
        />
      </div>

      {/* Tabela de Últimas Vendas */}
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Últimas Vendas</h2>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operador</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {latestSales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(sale.sale_date)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sale.users?.username || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-bold">{formatCurrency(sale.total_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Componente de Card (pode ser movido para um arquivo separado)
interface KpiCardProps {
  title: string;
  value: string;
  icon: string;
}

function KpiCard({ title, value, icon }: KpiCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
      <div className="text-4xl mr-4">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
