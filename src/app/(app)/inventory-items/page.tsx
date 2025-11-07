"use client";

import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/database.types";

// Tipos
type EstoqueItem = Database['public']['Tables']['estoque_itens']['Row'];
type EstoqueGrupo = Database['public']['Tables']['estoque_grupos']['Row'];
type EstoqueItemWithGroup = EstoqueItem & {
  estoque_grupos: { nome: string } | null;
};

export default function InventoryItemsPage() {
  const supabase = createClient();
  const [items, setItems] = useState<EstoqueItemWithGroup[]>([]);
  const [groups, setGroups] = useState<EstoqueGrupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<EstoqueItem | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [itemsRes, groupsRes] = await Promise.all([
        supabase.from("estoque_itens").select("*, estoque_grupos(nome)").order("nome"),
        supabase.from("estoque_grupos").select("*").order("nome"),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (groupsRes.error) throw groupsRes.error;

      setItems(itemsRes.data as EstoqueItemWithGroup[] || []);
      setGroups(groupsRes.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja deletar este item?")) return;
    const { error } = await supabase.from("estoque_itens").delete().eq("id", id);
    if (error) {
      setError(error.message);
    } else {
      setItems(items.filter((i) => i.id !== id));
    }
  };

  const handleShowForm = (item: EstoqueItem | null = null) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleCloseForm = (needsReload: boolean) => {
    setShowForm(false);
    setEditingItem(null);
    if (needsReload) fetchData();
  };

  if (loading) return <div>Carregando itens...</div>;
  if (error) return <div className="text-red-500">Erro: {error}</div>;

  if (showForm) {
    return <ItemForm item={editingItem} groups={groups} onClose={handleCloseForm} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Itens de Estoque</h1>
        <button onClick={() => handleShowForm()} className="btn-primary">Novo Item</button>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="th-base">Nome</th>
              <th className="th-base">Código</th>
              <th className="th-base">Grupo</th>
              <th className="th-base">Estoque Atual</th>
              <th className="th-base">Estoque Mínimo</th>
              <th className="th-base text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="td-base font-medium">{item.nome}</td>
                <td className="td-base font-mono">{item.codigo}</td>
                <td className="td-base">{item.estoque_grupos?.nome || 'N/A'}</td>
                <td className="td-base font-mono">{`${item.estoque_atual} ${item.unidade_medida || ''}`}</td>
                <td className="td-base font-mono">{`${item.estoque_minimo} ${item.unidade_medida || ''}`}</td>
                <td className="td-base text-right">
                  <button onClick={() => handleShowForm(item)} className="text-blue-600 hover:text-blue-900 mr-4">Editar</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Deletar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Formulário ---

interface ItemFormProps {
  item: EstoqueItem | null;
  groups: EstoqueGrupo[];
  onClose: (needsReload: boolean) => void;
}

function ItemForm({ item, groups, onClose }: ItemFormProps) {
  const [formData, setFormData] = useState({
    nome: item?.nome || '',
    codigo: item?.codigo || '',
    grupo_id: item?.grupo_id?.toString() || '',
    estoque_atual: item?.estoque_atual?.toString() || '0',
    estoque_minimo: item?.estoque_minimo?.toString() || '0',
    unidade_medida: item?.unidade_medida || 'un',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        grupo_id: parseInt(formData.grupo_id),
        estoque_atual: parseInt(formData.estoque_atual),
        estoque_minimo: parseInt(formData.estoque_minimo),
      };

      const { error: upsertError } = await supabase.from('estoque_itens').upsert(item ? { ...payload, id: item.id } : payload);

      if (upsertError) throw upsertError;
      onClose(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{item ? 'Editar Item' : 'Novo Item'}</h2>
      <form onSubmit={handleSubmit} className="p-8 bg-white shadow-md rounded-lg max-w-2xl mx-auto grid grid-cols-2 gap-6">
        <div className="col-span-2">
          <label htmlFor="nome" className="label-style">Nome do Item</label>
          <input type="text" id="nome" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required className="input-text w-full" />
        </div>
        <div>
          <label htmlFor="codigo" className="label-style">Código</label>
          <input type="text" id="codigo" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} required className="input-text w-full" />
        </div>
        <div>
          <label htmlFor="grupo_id" className="label-style">Grupo</label>
          <select id="grupo_id" value={formData.grupo_id} onChange={e => setFormData({...formData, grupo_id: e.target.value})} required className="input-text w-full">
            <option value="" disabled>Selecione um grupo</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="estoque_atual" className="label-style">Estoque Atual</label>
          <input type="number" id="estoque_atual" value={formData.estoque_atual} onChange={e => setFormData({...formData, estoque_atual: e.target.value})} required className="input-text w-full" />
        </div>
        <div>
          <label htmlFor="estoque_minimo" className="label-style">Estoque Mínimo</label>
          <input type="number" id="estoque_minimo" value={formData.estoque_minimo} onChange={e => setFormData({...formData, estoque_minimo: e.target.value})} required className="input-text w-full" />
        </div>
        <div className="col-span-2">
          <label htmlFor="unidade_medida" className="label-style">Unidade de Medida</label>
          <input type="text" id="unidade_medida" value={formData.unidade_medida} onChange={e => setFormData({...formData, unidade_medida: e.target.value})} className="input-text w-full" placeholder="un, kg, L, etc."/>
        </div>
        {error && <p className="col-span-2 text-red-500 text-sm text-center">{error}</p>}
        <div className="col-span-2 flex justify-end gap-4 mt-4">
          <button type="button" onClick={() => onClose(false)} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? "Salvando..." : "Salvar"}</button>
        </div>
      </form>
    </div>
  );
}
