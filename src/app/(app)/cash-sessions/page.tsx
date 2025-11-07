"use client";

import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/database.types";

// Tipos
type CashSession = Database['public']['Tables']['cash_sessions']['Row'] & {
  users: { username: string } | null;
};

export default function CashSessionsPage() {
  const supabase = createClient();
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [viewingSession, setViewingSession] = useState<CashSession | null>(null); // Estado para o modal

  async function fetchData() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("cash_sessions")
      .select(`
        id,
        open_time,
        close_time,
        initial_amount,
        final_amount,
        expected_amount,
        difference,
        observations,
        status,
        users ( username )
      `)
      .order("open_time", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setSessions(data as CashSession[] || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleShowForm = () => {
    setShowForm(true);
  };

  const handleViewDetails = (session: CashSession) => {
    setViewingSession(session);
  };

  const handleCloseForm = (needsReload: boolean) => {
    setShowForm(false);
    if (needsReload) {
      fetchData();
    }
  };

  const handleCloseSession = async (sessionId: number) => {
    if (!window.confirm("Tem certeza que deseja fechar esta sessão de caixa? Esta ação não pode ser desfeita.")) {
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("cash_sessions")
      .update({ status: 'closed', close_time: new Date().toISOString() })
      .eq("id", sessionId);

    if (error) {
      setError(error.message);
    } else {
      fetchData(); // Recarrega os dados para mostrar o status atualizado
    }
    setLoading(false);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value / 100);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (loading) {
    return <div>Carregando sessões de caixa...</div>;
  }

  if (error) {
    return <div className="text-red-500">Erro: {error}</div>;
  }

  if (showForm) {
    return <OpenSessionForm onClose={handleCloseForm} />;
  }

  // Renderiza o Modal de Detalhes se uma sessão estiver sendo visualizada
  if (viewingSession) {
    return <SessionDetailsModal session={viewingSession} onClose={() => setViewingSession(null)} />
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Sessões de Caixa</h1>
        <button
          onClick={handleShowForm}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
        >
          Abrir Nova Sessão
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abertura</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fechamento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Inicial</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Final</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{session.users?.username || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(session.open_time)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(session.close_time)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(session.initial_amount)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(session.final_amount)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {session.status === 'open' ? (
                     <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Aberta</span>
                  ) : (
                     <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">Fechada</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                  {session.status === 'open' ? (
                    <button
                      onClick={() => handleCloseSession(session.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={loading}
                    >
                      Fechar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleViewDetails(session)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Detalhes
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// --- Componente do Formulário (será implementado) ---

interface OpenSessionFormProps {
  onClose: (needsReload: boolean) => void;
}

function OpenSessionForm({ onClose }: OpenSessionFormProps) {
    const [initialAmount, setInitialAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        const amountInCents = Math.round(parseFloat(initialAmount.replace(',', '.')) * 100);
        if (isNaN(amountInCents) || amountInCents < 0) {
            setError("Valor inicial inválido.");
            return;
        }
        
        // Simulação: obter o ID do usuário logado.
        // Em um app real, isso viria do contexto de autenticação.
        const FAKE_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Substituir pelo ID do usuário real

        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setError("Usuário não autenticado.");
            setLoading(false);
            return;
        }

        const { error: insertError } = await supabase.from('cash_sessions').insert({
            user_id: user.id,
            initial_amount: amountInCents,
            status: 'open',
        });

        setLoading(false);

        if (insertError) {
            setError(insertError.message);
        } else {
            onClose(true); // Fecha o formulário e recarrega a lista
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Abrir Nova Sessão de Caixa</h2>
            <form onSubmit={handleSubmit} className="p-8 bg-white shadow-md rounded-lg max-w-lg mx-auto">
                <div className="mb-4">
                    <label htmlFor="initialAmount" className="block text-sm font-medium text-gray-700">Valor Inicial (Troco)</label>
                    <input
                        type="text"
                        name="initialAmount"
                        id="initialAmount"
                        value={initialAmount}
                        onChange={(e) => setInitialAmount(e.target.value)}
                        required
                        className="mt-1 block w-full input-text"
                        placeholder="Ex: 50,00"
                    />
                </div>

                {error && (
                    <p className="my-2 text-sm text-center text-red-600">{error}</p>
                )}

                <div className="flex justify-end gap-4 mt-6">
                    <button type="button" onClick={() => onClose(false)} className="btn-secondary">
                        Cancelar
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? "Abrindo..." : "Abrir Caixa"}
                    </button>
                </div>
            </form>
        </div>
    );
}

// --- Componente do Modal de Detalhes da Sessão ---

interface SessionDetailsModalProps {
  session: CashSession;
  onClose: () => void;
}

function SessionDetailsModal({ session, onClose }: SessionDetailsModalProps) {
  const supabase = createClient();
  const [details, setDetails] = useState<{ sales: any[], movements: any[] }>({ sales: [], movements: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      try {
        const [salesRes, movementsRes] = await Promise.all([
          supabase.from("sales").select("*, sale_items(*, products(description))").eq("cash_session_id", session.id),
          supabase.from("cash_movements").select("*").eq("cash_session_id", session.id)
        ]);

        if (salesRes.error) throw salesRes.error;
        if (movementsRes.error) throw movementsRes.error;

        setDetails({ sales: salesRes.data, movements: movementsRes.data });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [session.id]);

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Detalhes da Sessão #{session.id}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>

        {loading ? (
          <p>Carregando detalhes...</p>
        ) : error ? (
          <p className="text-red-500">Erro ao carregar detalhes: {error}</p>
        ) : (
          <div className="space-y-8">
            {/* Resumo Financeiro */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600">Valor Inicial</p>
                    <p className="text-xl font-bold">{formatCurrency(session.initial_amount)}</p>
                </div>
                <div className="p-4 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600">Valor Esperado</p>
                    <p className="text-xl font-bold">{formatCurrency(session.expected_amount)}</p>
                </div>
                <div className="p-4 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600">Valor Final</p>
                    <p className="text-xl font-bold">{formatCurrency(session.final_amount)}</p>
                </div>
                <div className={`p-4 rounded-lg ${ (session.difference ?? 0) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <p className={`text-sm ${(session.difference ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>Diferença</p>
                    <p className={`text-xl font-bold ${(session.difference ?? 0) >= 0 ? 'text-green-800' : 'text-red-800'}`}>{formatCurrency(session.difference)}</p>
                </div>
            </div>

            {/* Vendas */}
            <div>
              <h3 className="text-xl font-semibold mb-2">Vendas na Sessão</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="th-base">ID Venda</th>
                      <th className="th-base">Total</th>
                      <th className="th-base">Itens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.sales.map(sale => (
                      <tr key={sale.id}>
                        <td className="td-base">{sale.id}</td>
                        <td className="td-base font-mono">{formatCurrency(sale.total_amount)}</td>
                        <td className="td-base">{sale.sale_items.length}</td>
                      </tr>
                    ))}
                     {details.sales.length === 0 && <tr><td colSpan={3} className="text-center p-4 text-gray-500">Nenhuma venda nesta sessão.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Movimentações */}
            <div>
              <h3 className="text-xl font-semibold mb-2">Movimentações de Caixa</h3>
               <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="th-base">Tipo</th>
                      <th className="th-base">Valor</th>
                      <th className="th-base">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.movements.map(mov => (
                      <tr key={mov.id}>
                        <td className="td-base capitalize">{mov.type}</td>
                        <td className={`td-base font-mono ${mov.type === 'suprimento' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(mov.amount)}</td>
                        <td className="td-base">{mov.reason || '-'}</td>
                      </tr>
                    ))}
                    {details.movements.length === 0 && <tr><td colSpan={3} className="text-center p-4 text-gray-500">Nenhuma movimentação nesta sessão.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
