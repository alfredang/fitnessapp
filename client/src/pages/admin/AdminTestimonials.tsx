import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { api, apiError } from '../../lib/api';
import type { Testimonial } from '../../lib/types';
import { Modal, Spinner, ConfirmButton } from '../../components/ui';

interface TForm {
  authorName: string;
  role: string;
  avatarUrl: string;
  quote: string;
  rating: number;
  isPublished: boolean;
  order: number;
}

export default function AdminTestimonials() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const { data: items = [], isLoading } = useQuery<Testimonial[]>({
    queryKey: ['admin-testimonials'],
    queryFn: async () => (await api.get('/testimonials?all=1')).data,
  });

  const form = useForm<TForm>();

  function openCreate() {
    setEditing(null);
    form.reset({ authorName: '', role: '', avatarUrl: '', quote: '', rating: 5, isPublished: true, order: 0 });
    setOpen(true);
  }
  function openEdit(t: Testimonial) {
    setEditing(t);
    form.reset({
      authorName: t.authorName,
      role: t.role ?? '',
      avatarUrl: t.avatarUrl ?? '',
      quote: t.quote,
      rating: t.rating,
      isPublished: t.isPublished,
      order: t.order,
    });
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: (v: TForm) => {
      const payload = { ...v, rating: Number(v.rating), order: Number(v.order) };
      return editing
        ? api.put(`/testimonials/${editing.id}`, payload)
        : api.post('/testimonials', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-testimonials'] });
      qc.invalidateQueries({ queryKey: ['testimonials'] });
      setOpen(false);
    },
    onError: (e) => setError(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/testimonials/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-testimonials'] }),
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">Testimonials</h2>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={18} /> New testimonial
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((t) => (
          <div key={t.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex gap-0.5 text-brand-500">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              <div className="flex gap-1">
                <button className="btn-ghost p-1.5" onClick={() => openEdit(t)}>
                  <Pencil size={15} />
                </button>
                <ConfirmButton className="btn-ghost p-1.5 text-red-600" onConfirm={() => remove.mutate(t.id)}>
                  <Trash2 size={15} />
                </ConfirmButton>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-700">“{t.quote}”</p>
            <div className="mt-3 text-sm font-semibold">{t.authorName}</div>
            <div className="text-xs text-slate-400">{t.role}</div>
            {!t.isPublished && <span className="badge mt-2 bg-slate-200 text-slate-500">Hidden</span>}
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit testimonial' : 'New testimonial'}>
        <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Author name</label>
              <input className="input" {...form.register('authorName', { required: true })} />
            </div>
            <div>
              <label className="label">Role / result</label>
              <input className="input" {...form.register('role')} />
            </div>
          </div>
          <div>
            <label className="label">Quote</label>
            <textarea className="input" rows={3} {...form.register('quote', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Rating (1-5)</label>
              <input className="input" type="number" min={1} max={5} {...form.register('rating')} />
            </div>
            <div>
              <label className="label">Display order</label>
              <input className="input" type="number" {...form.register('order')} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register('isPublished')} /> Published
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
