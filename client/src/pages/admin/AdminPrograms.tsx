import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api, apiError } from '../../lib/api';
import type { Program } from '../../lib/types';
import { money } from '../../lib/format';
import { Modal, Spinner, ConfirmButton } from '../../components/ui';

interface ProgramForm {
  title: string;
  description: string;
  imageUrl: string;
  category: 'fitness' | 'dietary';
  price: number;
  isPublished: boolean;
  order: number;
}

export default function AdminPrograms() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Program | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const { data: programs = [], isLoading } = useQuery<Program[]>({
    queryKey: ['admin-programs'],
    queryFn: async () => (await api.get('/programs?all=1')).data,
  });

  const form = useForm<ProgramForm>();

  function openCreate() {
    setEditing(null);
    form.reset({ title: '', description: '', imageUrl: '', category: 'fitness', price: 0, isPublished: true, order: 0 });
    setOpen(true);
  }
  function openEdit(p: Program) {
    setEditing(p);
    form.reset({
      title: p.title,
      description: p.description,
      imageUrl: p.imageUrl ?? '',
      category: p.category as 'fitness' | 'dietary',
      price: p.price,
      isPublished: p.isPublished,
      order: p.order,
    });
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: (values: ProgramForm) => {
      const payload = { ...values, price: Number(values.price), order: Number(values.order) };
      return editing
        ? api.put(`/programs/${editing.id}`, payload)
        : api.post('/programs', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-programs'] });
      qc.invalidateQueries({ queryKey: ['programs'] });
      setOpen(false);
    },
    onError: (e) => setError(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/programs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-programs'] }),
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">Programs</h2>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={18} /> New program
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {programs.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3 capitalize">{p.category}</td>
                <td className="px-4 py-3">{money(p.price)}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${p.isPublished ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                    {p.isPublished ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button className="btn-ghost p-2" onClick={() => openEdit(p)}>
                      <Pencil size={16} />
                    </button>
                    <ConfirmButton
                      className="btn-ghost p-2 text-red-600"
                      onConfirm={() => remove.mutate(p.id)}
                    >
                      <Trash2 size={16} />
                    </ConfirmButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit program' : 'New program'}>
        <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" {...form.register('title', { required: true })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} {...form.register('description', { required: true })} />
          </div>
          <div>
            <label className="label">Image URL</label>
            <input className="input" {...form.register('imageUrl')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input" {...form.register('category')}>
                <option value="fitness">Fitness</option>
                <option value="dietary">Dietary</option>
              </select>
            </div>
            <div>
              <label className="label">Price ($)</label>
              <input className="input" type="number" step="1" {...form.register('price')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Display order</label>
              <input className="input" type="number" {...form.register('order')} />
            </div>
            <label className="mt-7 flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register('isPublished')} /> Published
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save program'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
