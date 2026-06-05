import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Dumbbell, CalendarDays, Inbox, Bell } from 'lucide-react';
import { useState } from 'react';
import { api, apiError } from '../../lib/api';
import { Spinner } from '../../components/ui';

interface Stats {
  members: number;
  programs: number;
  classes: number;
  openClasses: number;
  leads: number;
  newLeads: number;
}

export default function AdminDashboard() {
  const [msg, setMsg] = useState('');
  const { data, isLoading } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: async () => (await api.get('/admin/stats')).data,
  });

  const runReminders = useMutation({
    mutationFn: () => api.post('/admin/run-reminders'),
    onSuccess: (res) => setMsg(`Reminder sweep sent ${res.data.sent} email(s).`),
    onError: (e) => setMsg(apiError(e)),
  });

  if (isLoading || !data) return <Spinner />;

  const cards = [
    { label: 'Members', value: data.members, icon: Users, to: '/admin/members' },
    { label: 'Programs', value: data.programs, icon: Dumbbell, to: '/admin/programs' },
    { label: 'Open classes', value: `${data.openClasses}/${data.classes}`, icon: CalendarDays, to: '/admin/classes' },
    { label: 'New leads', value: data.newLeads, icon: Inbox, to: '/admin/leads' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="card p-6 transition hover:shadow-md">
            <c.icon className="text-brand-600" size={22} />
            <div className="mt-3 text-3xl font-extrabold">{c.value}</div>
            <div className="text-sm text-slate-500">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="card p-6">
        <h3 className="flex items-center gap-2 font-bold">
          <Bell size={18} className="text-brand-600" /> Class reminder automation
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Reminders for classes starting within 24h are sent automatically every hour.
          Trigger a sweep now to test it.
        </p>
        <button
          className="btn-primary mt-4"
          disabled={runReminders.isPending}
          onClick={() => runReminders.mutate()}
        >
          {runReminders.isPending ? 'Running…' : 'Run reminder sweep now'}
        </button>
        {msg && <p className="mt-3 text-sm text-slate-600">{msg}</p>}
      </div>
    </div>
  );
}
