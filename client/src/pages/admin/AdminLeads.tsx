import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Mail, Phone } from 'lucide-react';
import { api } from '../../lib/api';
import type { Lead, LeadStatus } from '../../lib/types';
import { formatDate } from '../../lib/format';
import { Spinner, ConfirmButton, EmptyState } from '../../components/ui';

const statusStyle: Record<LeadStatus, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-amber-100 text-amber-700',
  CONVERTED: 'bg-green-100 text-green-700',
};

export default function AdminLeads() {
  const qc = useQueryClient();
  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['admin-leads'],
    queryFn: async () => (await api.get('/leads')).data,
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      api.patch(`/leads/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-leads'] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/leads/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-leads'] }),
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">Leads</h2>
        <span className="text-sm text-slate-400">{leads.length} total</span>
      </div>

      {leads.length === 0 ? (
        <EmptyState>No leads yet. Submissions from the website form appear here.</EmptyState>
      ) : (
        <div className="space-y-3">
          {leads.map((l) => (
            <div key={l.id} className="card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{l.name}</span>
                    <span className={`badge ${statusStyle[l.status]}`}>{l.status}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Mail size={14} /> {l.email}</span>
                    {l.phone && <span className="flex items-center gap-1"><Phone size={14} /> {l.phone}</span>}
                    {l.interest && <span>Interest: {l.interest}</span>}
                  </div>
                  {l.message && <p className="mt-2 text-sm text-slate-600">{l.message}</p>}
                  <p className="mt-1 text-xs text-slate-400">{formatDate(l.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="input w-36"
                    value={l.status}
                    onChange={(e) => update.mutate({ id: l.id, status: e.target.value as LeadStatus })}
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="CONVERTED">Converted</option>
                  </select>
                  <ConfirmButton className="btn-ghost p-2 text-red-600" onConfirm={() => remove.mutate(l.id)}>
                    <Trash2 size={16} />
                  </ConfirmButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
