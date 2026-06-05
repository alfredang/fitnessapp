import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import type { ReactNode } from 'react';
import { api } from '../../lib/api';

interface Providers {
  google: boolean;
  facebook: boolean;
  instagram: boolean;
  devMock: boolean;
}

const providerMeta = [
  { key: 'google' as const, label: 'Google', color: 'hover:bg-red-50 text-red-600' },
  { key: 'facebook' as const, label: 'Facebook', color: 'hover:bg-blue-50 text-blue-600' },
  { key: 'instagram' as const, label: 'Instagram', color: 'hover:bg-pink-50 text-pink-600' },
];

export function SocialButtons() {
  const { data } = useQuery<Providers>({
    queryKey: ['providers'],
    queryFn: async () => (await api.get('/auth/providers')).data,
  });
  return (
    <div className="space-y-2">
      {providerMeta.map((p) => {
        const configured = data?.[p.key];
        const mock = data?.devMock;
        const usable = configured || mock; // real keys OR dev mock
        return (
          <a
            key={p.key}
            href={`/api/auth/${p.key}`}
            className={`btn-outline w-full ${p.color} ${usable ? '' : 'pointer-events-none opacity-50'}`}
            title={
              configured
                ? ''
                : mock
                ? 'Dev mode — logs in as a demo account (no OAuth keys needed)'
                : 'Not configured — add OAuth keys in .env'
            }
          >
            Continue with {p.label}
            {!configured && mock && <span className="ml-1 text-[10px] uppercase">(demo)</span>}
            {!configured && !mock && <span className="ml-1 text-[10px] uppercase">(soon)</span>}
          </a>
        );
      })}
    </div>
  );
}

export function AuthShell({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="card w-full max-w-md p-8">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-xl font-extrabold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
            <Dumbbell size={18} />
          </span>
          PulseFit
        </Link>
        <h1 className="text-center text-2xl font-bold">{title}</h1>
        <div className="mt-6">{children}</div>
        <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>
      </div>
    </div>
  );
}
