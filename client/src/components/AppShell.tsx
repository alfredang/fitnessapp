import { useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  Menu,
  X,
  LogOut,
  Eye,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../lib/auth';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export function AppShell({
  nav,
  title,
  children,
}: {
  nav: NavItem[];
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { user, logout, impersonate, stopImpersonate } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  async function handleViewAsMember() {
    await impersonate();
    navigate('/app');
  }

  async function handleBackToAdmin() {
    await stopImpersonate();
    navigate('/admin');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Impersonation banner */}
      {user?.isImpersonating && (
        <div className="flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-white">
          <Eye size={16} /> Viewing as member
          <button
            onClick={handleBackToAdmin}
            className="ml-2 inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-1 hover:bg-white/30"
          >
            <ArrowLeft size={14} /> Back to admin
          </button>
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center justify-between px-5">
            <Link to="/" className="flex items-center gap-2 font-extrabold text-ink-900">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
                <Dumbbell size={18} />
              </span>
              PulseFit
            </Link>
            <button className="lg:hidden" onClick={() => setOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <nav className="space-y-1 px-3 py-2">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-700 hover:bg-slate-100'
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Backdrop on mobile */}
        {open && (
          <div
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Main */}
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:px-8">
            <div className="flex items-center gap-3">
              <button className="lg:hidden" onClick={() => setOpen(true)}>
                <Menu size={22} />
              </button>
              <h1 className="text-lg font-bold text-ink-900">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              {user?.role === 'ADMIN' && !user.isImpersonating && (
                <button
                  onClick={handleViewAsMember}
                  className="hidden items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-slate-50 sm:inline-flex"
                >
                  <Eye size={16} /> View as member
                </button>
              )}
              <div className="flex items-center gap-2">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {user?.name?.[0]?.toUpperCase()}
                  </span>
                )}
                <span className="hidden text-sm font-medium sm:inline">
                  {user?.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="rounded-lg p-2 text-ink-700 hover:bg-slate-100"
              >
                <LogOut size={18} />
              </button>
            </div>
          </header>
          <main className="flex-1 p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
