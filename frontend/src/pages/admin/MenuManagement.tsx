import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ToggleLeft, ToggleRight, Pencil, Check, X } from 'lucide-react';
import { menuApi } from '../../lib/api';
import { formatRupiah } from '../../lib/utils';
import { CATEGORY_LABELS } from '../../types';
import type { MenuItem } from '../../types';

export default function MenuManagement() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', category: 'makanan_utama' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', category: '' });

  const fetchItems = async () => {
    const { data } = await menuApi.getAll();
    setItems(data);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.price) return;
    await menuApi.create({ name: form.name, price: parseInt(form.price), category: form.category });
    setForm({ name: '', price: '', category: 'makanan_utama' });
    setShowForm(false);
    fetchItems();
  };

  const handleEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setEditForm({ name: item.name, price: String(item.price), category: item.category });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.name || !editForm.price) return;
    await menuApi.update(editingId, {
      name: editForm.name,
      price: parseInt(editForm.price),
      category: editForm.category,
    });
    setEditingId(null);
    fetchItems();
  };

  const handleToggle = async (id: string, current: boolean) => {
    await menuApi.toggleAvailability(id, !current);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus menu ini?')) return;
    await menuApi.delete(id);
    fetchItems();
  };

  const grouped = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Kelola Menu</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm py-2 px-3 flex items-center gap-1">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {showForm && (
        <div className="card mb-4 space-y-3">
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Nama menu" />
          <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="input-field" placeholder="Harga" />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={handleAdd} className="btn-primary w-full">Simpan</button>
        </div>
      )}

      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} className="mb-6">
          <h2 className="font-semibold text-gray-600 text-sm mb-2">{CATEGORY_LABELS[cat] || cat}</h2>
          <div className="space-y-2">
            {catItems.map(item => (
              <div key={item.id} className={`card ${!item.is_available ? 'opacity-50' : ''}`}>
                {editingId === item.id ? (
                  <div className="space-y-2">
                    <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="input-field" placeholder="Nama menu" />
                    <input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} className="input-field" placeholder="Harga" />
                    <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="input-field">
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit} className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-1">
                        <Check className="w-4 h-4" /> Simpan
                      </button>
                      <button onClick={() => setEditingId(null)} className="btn-secondary flex-1 text-sm py-2 flex items-center justify-center gap-1">
                        <X className="w-4 h-4" /> Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-orange-600 text-sm">{formatRupiah(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-400 hover:text-blue-600">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleToggle(item.id, item.is_available)} className="p-1.5">
                        {item.is_available ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
