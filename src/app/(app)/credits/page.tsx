'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

// Tipo para o resumo das dívidas
type DebtSummary = {
  id: number; // customer id
  name: string | null;
  phone: string | null;
  balance: number; // vem da VIEW (em centavos)
};

// Função para formatar centavos para R$
const formatCurrency = (value: number | null) => {
  if (value === null) return "R$ 0,00";
  return (value / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

export default function CreditsPage() {
  const supabase = createClient();
  const [debts, setDebts] = useState<DebtSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<DebtSummary | null>(null);

  const fetchDebts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('debt_summary')
      .select('*')
      .order('name');

    if (error) {
      setError(error.message);
    } else if (data) {
      setDebts(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const handleOpenPaymentModal = (customer: DebtSummary) => {
    setSelectedCustomer(customer);
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = (needsReload: boolean) => {
    setShowPaymentModal(false);
    if (needsReload) {
      fetchDebts();
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div className="text-red-500">Erro: {error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestão de Fiado</h1>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Devedor</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {debts.map((debt) => (
              <tr key={debt.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{debt.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{debt.phone || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(debt.balance)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                  <button onClick={() => handleOpenPaymentModal(debt)} className="text-blue-600 hover:text-blue-900">
                    Registrar Pagamento
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showPaymentModal && selectedCustomer && <PaymentModal onClose={handleClosePaymentModal} customer={selectedCustomer} />} 
    </div>
  );
}

interface PaymentModalProps {
  onClose: (needsReload: boolean) => void;
  customer: DebtSummary;
}

function PaymentModal({ onClose, customer }: PaymentModalProps) {
  const supabase = createClient();
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [paymentMethods, setPaymentMethods] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      const { data, error } = await supabase.from('payment_methods').select('id, name');
      if (data) {
        setPaymentMethods(data);
        if (data.length > 0) {
          setPaymentMethod(data[0].name);
        }
      }
    };
    fetchPaymentMethods();
  }, [supabase]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const amountInCents = Math.round(parseFloat(paymentAmount.replace(",", ".")) * 100);

    if (isNaN(amountInCents) || amountInCents <= 0) {
      setError("Valor de pagamento inválido.");
      setLoading(false);
      return;
    }

    const { error: rpcError } = await supabase.rpc(
      'add_credit_payment_and_update_sales',
      {
        p_customer_id: customer.id,
        p_amount_paid: amountInCents,
        p_payment_method: paymentMethod,
      }
    );

    if (rpcError) {
      setError(rpcError.message);
    } else {
      onClose(true);
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Registrar Pagamento para: {customer.name}</h2>
        <form onSubmit={handlePaymentSubmit}>
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Valor do Pagamento</label>
            <input type="text" id="amount" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="mt-1 block w-full input-text" />
          </div>
          <div className="mb-4">
            <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">Método de Pagamento</label>
            <select id="payment_method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 block w-full input-text">
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.name}>{method.name}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={() => onClose(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Pagamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}