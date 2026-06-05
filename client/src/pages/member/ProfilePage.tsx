import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Camera } from 'lucide-react';
import { api, apiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const profile = useForm({
    defaultValues: { name: user?.name ?? '', bio: user?.bio ?? '', phone: user?.phone ?? '' },
  });
  const pwd = useForm<{ currentPassword: string; newPassword: string }>();

  async function saveProfile(values: { name: string; bio: string; phone: string }) {
    setMsg(''); setErr('');
    try {
      await api.put('/users/me', values);
      await refresh();
      setMsg('Profile updated.');
    } catch (e) {
      setErr(apiError(e));
    }
  }

  async function uploadAvatar(file: File) {
    setMsg(''); setErr('');
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      await api.post('/users/me/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refresh();
      setMsg('Photo updated.');
    } catch (e) {
      setErr(apiError(e));
    }
  }

  async function changePassword(values: { currentPassword: string; newPassword: string }) {
    setMsg(''); setErr('');
    try {
      await api.post('/users/me/password', values);
      pwd.reset();
      setMsg('Password changed.');
    } catch (e) {
      setErr(apiError(e));
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {msg && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{msg}</p>}
      {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{err}</p>}

      {/* Avatar */}
      <div className="card flex items-center gap-5 p-6">
        <div className="relative">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
              {user?.name?.[0]}
            </span>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 rounded-full bg-brand-600 p-2 text-white shadow"
          >
            <Camera size={14} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
          />
        </div>
        <div>
          <h2 className="text-lg font-bold">{user?.name}</h2>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <p className="text-xs text-slate-400">Signed in via {user?.provider}</p>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={profile.handleSubmit(saveProfile)} className="card space-y-4 p-6">
        <h3 className="font-bold">Profile details</h3>
        <div>
          <label className="label">Name</label>
          <input className="input" {...profile.register('name', { required: true })} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" {...profile.register('phone')} />
        </div>
        <div>
          <label className="label">Bio</label>
          <textarea className="input" rows={3} {...profile.register('bio')} />
        </div>
        <button className="btn-primary">Save changes</button>
      </form>

      {/* Password */}
      <form onSubmit={pwd.handleSubmit(changePassword)} className="card space-y-4 p-6">
        <h3 className="font-bold">Reset password</h3>
        <div>
          <label className="label">Current password</label>
          <input className="input" type="password" {...pwd.register('currentPassword')} placeholder="Leave blank if social login" />
        </div>
        <div>
          <label className="label">New password</label>
          <input
            className="input"
            type="password"
            {...pwd.register('newPassword', { required: true, minLength: 6 })}
          />
        </div>
        <button className="btn-primary">Update password</button>
      </form>
    </div>
  );
}
