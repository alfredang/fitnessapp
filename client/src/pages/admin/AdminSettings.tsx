import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Bell } from 'lucide-react';
import { api } from '../../lib/api';
import { Spinner } from '../../components/ui';

interface Settings {
  autoCloseEnabled: boolean;
  remindersEnabled: boolean;
}

export default function AdminSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Settings>({
    queryKey: ['admin-settings'],
    queryFn: async () => (await api.get('/admin/settings')).data,
  });

  const update = useMutation({
    mutationFn: (patch: Partial<Settings>) => api.put('/admin/settings', patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-settings'] }),
  });

  if (isLoading || !data) return <Spinner />;

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold">Automation settings</h2>
      <p className="mt-1 text-sm text-slate-500">
        Enable or disable the agentic workflows that run on the platform.
      </p>

      <div className="mt-6 space-y-4">
        <ToggleCard
          icon={Lock}
          title="Auto-close classes at capacity"
          description="When a class reaches its maximum number of participants (max pax), automatically set its status to CLOSED so no further bookings are accepted. Admins can still close/reopen classes manually."
          enabled={data.autoCloseEnabled}
          onToggle={(v) => update.mutate({ autoCloseEnabled: v })}
          pending={update.isPending}
        />
        <ToggleCard
          icon={Bell}
          title="Class reminder emails"
          description="Every hour, email members about classes they've booked that start within the next 24 hours. Each member is reminded once per class."
          enabled={data.remindersEnabled}
          onToggle={(v) => update.mutate({ remindersEnabled: v })}
          pending={update.isPending}
        />
      </div>
    </div>
  );
}

function ToggleCard({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
  pending,
}: {
  icon: typeof Lock;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  pending: boolean;
}) {
  return (
    <div className="card flex items-start justify-between gap-4 p-5">
      <div className="flex gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <Icon size={20} />
        </span>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
          <span
            className={`badge mt-2 ${enabled ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}
          >
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={pending}
        onClick={() => onToggle(!enabled)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${
          enabled ? 'bg-brand-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
            enabled ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}
