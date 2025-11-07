"use client";

import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/database.types";
import { useAuth } from "@/context/AuthContext";

// Tipos
type EstoqueItem = Pick<Database['public']['Tables']['estoque_itens']['Row'], 'id' | 'nome'>;
type EstoqueMovement = Database['public']['Tables']['estoque_movements']['Row'] & {
  estoque_itens: { nome: string } | null;
  users: { username: string } | null;
};

export default function StockControlPage() {
  const supabase = createClient();
  const { user } = useAuth();
  const [movements, setMovements] = useState<EstoqueMovement[]>([]);
  const [items, setItems] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [movementsRes, itemsRes] = await Promise.all([
        supabase.from("estoque_movements").select("*, estoque_itens(nome), users(username)").order("created_at", { ascending: false }).limit(100),
        supabase.from("estoque_itens").select("id, nome").order("nome"),
      ]);

      if (movementsRes.error) throw movementsRes.error;
      if (itemsRes.error) throw itemsRes.error;

      setMovements(movementsRes.data as EstoqueMovement[] || []);
      setItems(itemsRes.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleFormSubmit = (needsReload: boolean) => {
    if (needsReload) {
      fetchData();
    }
  };

  if (loading) {
    return <div>Carregando dados de estoque...</div>;
  }

  if (error) {
    return <div className="text-red-500">Erro: {error}</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <h2 className="text-2xl font-bold mb-6">Registrar Movimentação de Item</h2>
        <MovementForm items={items} user={user} onSubmit={handleFormSubmit} />
      </div>

      <div className="lg:col-span-2">
        <h2 className="text-2xl font-bold mb-6">Histórico de Movimentações</h2>
        <MovementList movements={movements} />
      </div>
    </div>
  );
}

// --- Componente do Formulário ---

interface MovementFormProps {
  items: EstoqueItem[];
  user: { id: string } | null;
  onSubmit: (needsReload: boolean) => void;
}

function MovementForm({ items, user, onSubmit }: MovementFormProps) {
  const [formData, setFormData] = useState({ itemId: '', type: 'entrada', quantity: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Usuário não autenticado.");
      return;
    }
    if (!formData.itemId || !formData.quantity) {
        setError("Item e quantidade são obrigatórios.");
        return;
    }

    setLoading(true);
    try {
      const { error: rpcError } = await supabase.rpc("adjust_estoque_item", {
        p_item_id: parseInt(formData.itemId),
        p_user_id: user.id,
        p_movement_type: formData.type,
        p_quantity: parseFloat(formData.quantity.replace(', ', '.')),
        p_reason: formData.reason || null,
      });

      if (rpcError) throw rpcError;

      setFormData({ itemId: '', type: 'entrada', quantity: '', reason: '' });
      onSubmit(true);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white shadow-md rounded-lg space-y-4">
      {error && <p className="text-red-500 text-sm text-center p-2 bg-red-50 rounded">{error}</p>}
      
      <div>
        <label htmlFor="itemId" className="label-style">Item de Estoque</label>
        <select id="itemId" value={formData.itemId} onChange={e => setFormData({...formData, itemId: e.target.value})} className="input-text w-full">
          <option value="" disabled>Selecione um item</option>
          {items.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
            <label htmlFor="type" className="label-style">Tipo</label>
            <select id="type" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="input-text w-full">
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
            </select>
        </div>
        <div>
            <label htmlFor="quantity" className="label-style">Quantidade</label>
            <input type="text" id="quantity" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="input-text w-full" placeholder="Ex: 10"/>
        </div>
      </div>

      <div>
        <label htmlFor="reason" className="label-style">Motivo (Opcional)</label>
        <input type="text" id="reason" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="input-text w-full" placeholder="Ex: Compra de material"/>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Salvando..." : "Registrar Movimentação"}
      </button>
    </form>
  );
}

// --- Componente da Lista ---

function MovementList({ movements }: { movements: EstoqueMovement[] }) {
  const formatDate = (date: string) => new Date(date).toLocaleString('pt-BR');

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="th-base">Item</th>
            <th className="th-base">Tipo</th>
            <th className="th-base">Qtd.</th>
            <th className="th-base">Usuário</th>
            <th className="th-base">Data</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {movements.length === 0 ? (
            <tr><td colSpan={5} className="text-center p-8 text-gray-500">Nenhuma movimentação registrada.</td></tr>
          ) : (
            movements.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="td-base font-medium">{m.estoque_itens?.nome || 'N/A'}</td>
                <td className="td-base">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${m.type === 'entrada' ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100'}`}>
                        {m.type}
                    </span>
                </td>
                <td className="td-base font-mono">{m.quantity}</td>
                <td className="td-base">{m.users?.username || 'N/A'}</td>
                <td className="td-base">{formatDate(m.created_at)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}