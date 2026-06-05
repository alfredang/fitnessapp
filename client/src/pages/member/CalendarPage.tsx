import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api, apiError } from '../../lib/api';
import type { Booking, ClassSession } from '../../lib/types';
import { formatClassTime } from '../../lib/format';
import { StatusBadge, Spinner } from '../../components/ui';

export default function CalendarPage() {
  const qc = useQueryClient();
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [error, setError] = useState('');

  const { data: classes = [], isLoading } = useQuery<ClassSession[]>({
    queryKey: ['classes'],
    queryFn: async () => (await api.get('/classes')).data,
  });
  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ['my-bookings'],
    queryFn: async () => (await api.get('/bookings/mine')).data,
  });

  const bookedIds = useMemo(
    () => new Set(bookings.map((b) => b.classSessionId)),
    [bookings]
  );

  const book = useMutation({
    mutationFn: (classSessionId: string) =>
      api.post('/bookings', { classSessionId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] });
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (e) => setError(apiError(e)),
  });
  const cancel = useMutation({
    mutationFn: (classSessionId: string) =>
      api.delete(`/bookings/${classSessionId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] });
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (e) => setError(apiError(e)),
  });

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const classesByDay = useMemo(() => {
    const map = new Map<string, ClassSession[]>();
    for (const c of classes) {
      const key = format(new Date(c.startsAt), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [classes]);

  const selectedKey = format(selected, 'yyyy-MM-dd');
  const dayClasses = classesByDay.get(selectedKey) ?? [];

  if (isLoading) return <Spinner />;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Calendar */}
      <div className="card p-5 lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{format(cursor, 'MMMM yyyy')}</h2>
          <div className="flex gap-1">
            <button className="btn-ghost p-2" onClick={() => setCursor(subMonths(cursor, 1))}>
              <ChevronLeft size={18} />
            </button>
            <button className="btn-ghost p-2" onClick={() => setCursor(addMonths(cursor, 1))}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const has = classesByDay.has(key);
            const isSel = isSameDay(day, selected);
            return (
              <button
                key={key}
                onClick={() => setSelected(day)}
                className={`relative aspect-square rounded-lg p-1 text-sm transition ${
                  isSel
                    ? 'bg-brand-600 text-white'
                    : isSameMonth(day, cursor)
                    ? 'hover:bg-slate-100'
                    : 'text-slate-300'
                }`}
              >
                {format(day, 'd')}
                {has && (
                  <span
                    className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
                      isSel ? 'bg-white' : 'bg-brand-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail */}
      <div className="card p-5">
        <h3 className="font-bold">{format(selected, 'EEEE, MMM d')}</h3>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 space-y-3">
          {dayClasses.length === 0 && (
            <p className="text-sm text-slate-400">No classes scheduled.</p>
          )}
          {dayClasses.map((c) => {
            const isBooked = bookedIds.has(c.id);
            return (
              <div key={c.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{c.title}</span>
                  <StatusBadge status={c.status} />
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {formatClassTime(c.startsAt, c.endsAt)} · {c.trainer}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {c.branch} · {c.spotsLeft ?? 0} spots left
                </div>
                <div className="mt-3">
                  {isBooked ? (
                    <button
                      className="btn-outline w-full text-red-600"
                      onClick={() => {
                        setError('');
                        cancel.mutate(c.id);
                      }}
                    >
                      Cancel booking
                    </button>
                  ) : (
                    <button
                      className="btn-primary w-full"
                      disabled={c.status !== 'OPEN'}
                      onClick={() => {
                        setError('');
                        book.mutate(c.id);
                      }}
                    >
                      {c.status === 'OPEN' ? 'Book this class' : 'Closed'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
