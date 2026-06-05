import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiError } from '../../lib/api';
import type { Program } from '../../lib/types';
import { money } from '../../lib/format';
import { Spinner } from '../../components/ui';
import { useState } from 'react';

interface Enrollment {
  id: string;
  program: Program & { classes: { id: string; title: string; startsAt: string }[] };
}

export default function MyProgramsPage() {
  const qc = useQueryClient();
  const [error, setError] = useState('');

  const { data: enrollments = [], isLoading } = useQuery<Enrollment[]>({
    queryKey: ['enrollments'],
    queryFn: async () => (await api.get('/bookings/enrollments')).data,
  });
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['programs'],
    queryFn: async () => (await api.get('/programs')).data,
  });

  const enrolledIds = new Set(enrollments.map((e) => e.program.id));

  const enroll = useMutation({
    mutationFn: (programId: string) => api.post('/bookings/enroll', { programId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enrollments'] }),
    onError: (e) => setError(apiError(e)),
  });
  const unenroll = useMutation({
    mutationFn: (programId: string) => api.delete(`/bookings/enroll/${programId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enrollments'] }),
    onError: (e) => setError(apiError(e)),
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-10">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <section>
        <h2 className="mb-4 text-xl font-bold">My programs</h2>
        {enrollments.length === 0 ? (
          <p className="text-slate-400">You haven't joined any programs yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {enrollments.map((e) => (
              <div key={e.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold">{e.program.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{e.program.description}</p>
                  </div>
                  <span className="badge bg-green-100 text-green-700">Active</span>
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  {e.program.classes.length} class(es) scheduled
                </p>
                <button
                  className="btn-outline mt-4 text-red-600"
                  onClick={() => unenroll.mutate(e.program.id)}
                >
                  Leave program
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Explore programs</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {programs
            .filter((p) => !enrolledIds.has(p.id))
            .map((p) => (
              <div key={p.id} className="card overflow-hidden">
                {p.imageUrl && (
                  <img src={p.imageUrl} alt="" className="h-32 w-full object-cover" />
                )}
                <div className="p-5">
                  <h3 className="font-bold">{p.title}</h3>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">{p.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-bold text-brand-600">{money(p.price)}</span>
                    <button className="btn-primary" onClick={() => enroll.mutate(p.id)}>
                      Join
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
