import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarDays, Dumbbell, Clock } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { Booking } from '../../lib/types';
import { formatClassTime } from '../../lib/format';
import { Spinner, EmptyState } from '../../components/ui';

export default function MemberDashboard() {
  const { user } = useAuth();
  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ['my-bookings'],
    queryFn: async () => (await api.get('/bookings/mine')).data,
  });

  const upcoming = (bookings ?? []).filter(
    (b) => new Date(b.classSession.startsAt) >= new Date()
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Hi, {user?.name?.split(' ')[0]} 👋</h2>
        <p className="text-slate-500">Here's what's coming up on your schedule.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CalendarDays} label="Upcoming classes" value={upcoming.length} />
        <StatCard icon={Dumbbell} label="Total bookings" value={bookings?.length ?? 0} />
        <Link to="/app/calendar" className="card flex items-center justify-center p-6 font-semibold text-brand-600 hover:bg-brand-50">
          Browse class calendar →
        </Link>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-bold">Your next classes</h3>
        {isLoading ? (
          <Spinner />
        ) : upcoming.length === 0 ? (
          <EmptyState>
            <p>No upcoming classes yet.</p>
            <Link to="/app/calendar" className="btn-primary mt-4">
              Book a class
            </Link>
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {upcoming.map((b) => (
              <div key={b.id} className="card flex items-center justify-between p-4">
                <div>
                  <div className="font-semibold">{b.classSession.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                    <Clock size={14} />
                    {formatClassTime(b.classSession.startsAt, b.classSession.endsAt)}
                  </div>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <div>{b.classSession.trainer}</div>
                  <div className="text-xs">{b.classSession.branch}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: number;
}) {
  return (
    <div className="card p-6">
      <Icon className="text-brand-600" size={22} />
      <div className="mt-3 text-3xl font-extrabold">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}
