import { Outlet } from 'react-router-dom';
import { CalendarDays, LayoutDashboard, User, Dumbbell } from 'lucide-react';
import { AppShell, type NavItem } from '../../components/AppShell';

const nav: NavItem[] = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/calendar', label: 'Class Calendar', icon: CalendarDays },
  { to: '/app/programs', label: 'My Programs', icon: Dumbbell },
  { to: '/app/profile', label: 'Profile', icon: User },
];

export default function MemberLayout() {
  return (
    <AppShell nav={nav} title="Member Area">
      <Outlet />
    </AppShell>
  );
}
