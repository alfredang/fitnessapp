import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api, apiError } from '../../lib/api';
import type { Member } from '../../lib/types';
import { useAuth } from '../../lib/auth';
import { formatDate } from '../../lib/format';
import { Modal, Spinner, ConfirmButton } from '../../components/ui';

interface MemberForm {
  name: string;
  email: string;
  role: 'MEMBER' | 'ADMIN';
  phone: string;
  password: string;
}

export default function AdminMembers() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [editing, setEditing] = useState<Member | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ['admin-members'],
    queryFn: async () => (await api.get('/users')).data,
  });

  const form = useForm<MemberForm>();

  function openCreate() {
    setEditing(null);
    setError('');
    form.reset({ name: '', email: '', role: 'MEMBER', phone: '', password: '' });
    setOpen(true);
  }
  function openEdit(m: Member) {
    setEditing(m);
    setError('');
    form.reset({
      name: m.name,
      email: m.email,
      role: m.role,
      phone: m.phone ?? '',
      password: '',
    });
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: (v: MemberForm) => {
      if (editing) {
        // Only send the password when the admin actually typed a new one.
        const payload: Partial<MemberForm> = { ...v };
        if (!payload.password) delete payload.password;
        return api.put(`/users/${editing.id}`, payload);
      }
      return api.post('/users', v);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-members'] });
      setOpen(false);
    },
    onError: (e) => setError(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-members'] }),
    onError: (e) => alert(apiError(e)),
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">Members</h2>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={18} /> New member
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Programs</th>
              <th className="px-4 py-3">Bookings</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 font-medium">{m.name}</td>
                <td className="px-4 py-3">{m.email}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${m.role === 'ADMIN' ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'}`}>
                    {m.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{m.provider}</td>
                <td className="px-4 py-3">{m.enrollments}</td>
                <td className="px-4 py-3">{m.bookings}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(m.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button className="btn-ghost p-1.5" onClick={() => openEdit(m)} title="Edit">
                      <Pencil size={15} />
                    </button>
                    {m.id !== user?.id && (
                      <ConfirmButton
                        className="btn-ghost p-1.5 text-red-600"
                        onConfirm={() => remove.mutate(m.id)}
                      >
                        <Trash2 size={15} />
                      </ConfirmButton>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit member' : 'New member'}>
        <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" {...form.register('name', { required: true })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" {...form.register('email', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Role</label>
              <select className="input" {...form.register('role')}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" {...form.register('phone')} />
            </div>
          </div>
          <div>
            <label className="label">
              Password {editing && <span className="text-xs font-normal text-slate-400">(leave blank to keep)</span>}
            </label>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              {...form.register('password', { required: !editing, minLength: 6 })}
            />
            {form.formState.errors.password && (
              <p className="mt-1 text-xs text-red-600">Password must be at least 6 characters.</p>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create member'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
