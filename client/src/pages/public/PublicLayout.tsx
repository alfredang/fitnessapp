import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Dumbbell, Menu, X } from 'lucide-react';
import { useAuth } from '../../lib/auth';

const links = [
  { href: '#membership', label: 'Membership' },
  { href: '#classes', label: 'Classes' },
  { href: '#programs', label: 'Programs' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#contact', label: 'Contact' },
];

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const dashHref = user ? (user.role === 'ADMIN' ? '/admin' : '/app') : '/login';

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
              <Dumbbell size={18} />
            </span>
            PulseFit
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-ink-700 hover:text-brand-600">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link to={dashHref} className="btn-ghost">
              {user ? 'Dashboard' : 'Log in'}
            </Link>
            <Link to="/register" className="btn-primary">
              Join Now
            </Link>
          </div>
          <button className="md:hidden" onClick={() => setOpen((v) => !v)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-2 text-sm font-medium text-ink-700"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex gap-2">
              <Link to={dashHref} className="btn-outline flex-1">
                {user ? 'Dashboard' : 'Log in'}
              </Link>
              <Link to="/register" className="btn-primary flex-1">
                Join
              </Link>
            </div>
          </div>
        )}
      </header>
      <Outlet />
    </div>
  );
}
