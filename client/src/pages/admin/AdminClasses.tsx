import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, Lock, Unlock } from 'lucide-react';
import { api, apiError } from '../../lib/api';
import type { ClassSession, ClassStatus, Program } from '../../lib/types';
import { formatClassTime } from '../../lib/format';
import { Modal, Spinner, StatusBadge, ConfirmButton } from '../../components/ui';

interface ClassForm {
  programId: string;
  title: string;
  trainer: string;
  branch: string;
  room: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
}

// Format an ISO string for a datetime-local input.
function toLocalInput(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}

export default function AdminClasses() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ClassSession | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const { data: classes = [], isLoading } = useQuery<ClassSession[]>({
    queryKey: ['admin-classes'],
    queryFn: async () => (await api.get('/classes')).data,
  });
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['admin-programs'],
    queryFn: async () => (await api.get('/programs?all=1')).data,
  });

  const form = useForm<ClassForm>();

  function openCreate() {
    setEditing(null);
    form.reset({
      programId: programs[0]?.id ?? '',
      title: '',
      trainer: '',
      branch: '',
      room: '',
      startsAt: '',
      endsAt: '',
      capacity: 12,
    });
    setOpen(true);
  }
  function openEdit(c: ClassSession) {
    setEditing(c);
    form.reset({
      programId: c.programId,
      title: c.title,
      trainer: c.trainer,
      branch: c.branch,
      room: c.room ?? '',
      startsAt: toLocalInput(c.startsAt),
      endsAt: toLocalInput(c.endsAt),
      capacity: c.capacity,
    });
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: (values: ClassForm) => {
      const payload = {
        ...values,
        capacity: Number(values.capacity),
        startsAt: new Date(values.startsAt).toISOString(),
        endsAt: new Date(values.endsAt).toISOString(),
      };
      return editing
        ? api.put(`/classes/${editing.id}`, payload)
        : api.post('/classes', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-classes'] });
      qc.invalidateQueries({ queryKey: ['classes'] });
      setOpen(false);
    },
    onError: (e) => setError(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/classes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-classes'] }),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ClassStatus }) =>
      api.patch(`/classes/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-classes'] }),
    onError: (e) => setError(apiError(e)),
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">Class schedule</h2>
        <button className="btn-primary" onClick={openCreate} disabled={programs.length === 0}>
          <Plus size={18} /> Schedule class
        </button>
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="space-y-3">
        {classes.map((c) => (
          <div key={c.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{c.title}</span>
                <StatusBadge status={c.status} />
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {formatClassTime(c.startsAt, c.endsAt)} · {c.trainer} · {c.branch}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {c.program?.title} · {c.booked ?? 0}/{c.capacity} booked
                {c.status === 'CLOSED' && (c.booked ?? 0) >= c.capacity && ' · auto-closed (full)'}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {c.status === 'OPEN' ? (
                <button
                  className="btn-outline text-amber-600"
                  onClick={() => setStatus.mutate({ id: c.id, status: 'CLOSED' })}
                >
                  <Lock size={14} /> Close
                </button>
              ) : c.status === 'CLOSED' ? (
                <button
                  className="btn-outline text-green-600"
                  onClick={() => setStatus.mutate({ id: c.id, status: 'OPEN' })}
                >
                  <Unlock size={14} /> Reopen
                </button>
              ) : null}
              <button className="btn-ghost p-2" onClick={() => openEdit(c)}>
                <Pencil size={16} />
              </button>
              <ConfirmButton
                className="btn-ghost p-2 text-red-600"
                onConfirm={() => remove.mutate(c.id)}
              >
                <Trash2 size={16} />
              </ConfirmButton>
            </div>
          </div>
        ))}
        {classes.length === 0 && <p className="text-slate-400">No classes scheduled yet.</p>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit class' : 'Schedule class'}>
        <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
          <div>
            <label className="label">Program</label>
            <select className="input" {...form.register('programId', { required: true })}>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Class title</label>
            <input className="input" {...form.register('title', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Trainer</label>
              <input className="input" {...form.register('trainer', { required: true })} />
            </div>
            <div>
              <label className="label">Branch</label>
              <input className="input" {...form.register('branch', { required: true })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Room</label>
              <input className="input" {...form.register('room')} />
            </div>
            <div>
              <label className="label">Capacity (max pax)</label>
              <input className="input" type="number" min={1} {...form.register('capacity', { required: true })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Starts</label>
              <input className="input" type="datetime-local" {...form.register('startsAt', { required: true })} />
            </div>
            <div>
              <label className="label">Ends</label>
              <input className="input" type="datetime-local" {...form.register('endsAt', { required: true })} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save class'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
