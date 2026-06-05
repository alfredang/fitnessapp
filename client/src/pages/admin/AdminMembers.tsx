import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Member } from '../../lib/types';
import { formatDate } from '../../lib/format';
import { Spinner } from '../../components/ui';

export default function AdminMembers() {
  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ['admin-members'],
    queryFn: async () => (await api.get('/users')).data,
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold">Members</h2>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
