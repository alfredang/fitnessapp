import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Dumbbell,
  CalendarDays,
  MessageSquareQuote,
  Inbox,
  FileText,
  Users,
  Settings,
} from 'lucide-react';
import { AppShell, type NavItem } from '../../components/AppShell';

const nav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/programs', label: 'Programs', icon: Dumbbell },
  { to: '/admin/classes', label: 'Classes', icon: CalendarDays },
  { to: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
  { to: '/admin/leads', label: 'Leads', icon: Inbox },
  { to: '/admin/content', label: 'Site Content (CMS)', icon: FileText },
  { to: '/admin/members', label: 'Members', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  return (
    <AppShell nav={nav} title="Admin">
      <Outlet />
    </AppShell>
  );
}
