import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public
import PublicLayout from './pages/public/PublicLayout';
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Member
import MemberLayout from './pages/member/MemberLayout';
import MemberDashboard from './pages/member/MemberDashboard';
import CalendarPage from './pages/member/CalendarPage';
import MyProgramsPage from './pages/member/MyProgramsPage';
import ProfilePage from './pages/member/ProfilePage';

// Admin
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPrograms from './pages/admin/AdminPrograms';
import AdminClasses from './pages/admin/AdminClasses';
import AdminTestimonials from './pages/admin/AdminTestimonials';
import AdminLeads from './pages/admin/AdminLeads';
import AdminContent from './pages/admin/AdminContent';
import AdminMembers from './pages/admin/AdminMembers';
import AdminSettings from './pages/admin/AdminSettings';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute role="MEMBER">
            <MemberLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MemberDashboard />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="programs" element={<MyProgramsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="programs" element={<AdminPrograms />} />
        <Route path="classes" element={<AdminClasses />} />
        <Route path="testimonials" element={<AdminTestimonials />} />
        <Route path="leads" element={<AdminLeads />} />
        <Route path="content" element={<AdminContent />} />
        <Route path="members" element={<AdminMembers />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
