import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { apiError } from '../../lib/api';
import { AuthShell, SocialButtons } from './AuthShell';

export default function RegisterPage() {
  const { register: registerUser, user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<{ name: string; email: string; password: string }>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate(user.role === 'ADMIN' ? '/admin' : '/app', { replace: true });
  }, [user, navigate]);

  async function onSubmit(values: { name: string; email: string; password: string }) {
    setError('');
    setBusy(true);
    try {
      await registerUser(values.name, values.email, values.password);
    } catch (e) {
      setError(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Join PulseFit"
      footer={
        <>
          Already a member?{' '}
          <Link to="/login" className="font-semibold text-brand-600">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <input className="input" {...register('name', { required: true })} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" {...register('email', { required: true })} />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            {...register('password', { required: true, minLength: 6 })}
            placeholder="At least 6 characters"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="btn-primary w-full">
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" /> OR <div className="h-px flex-1 bg-slate-200" />
      </div>
      <SocialButtons />
    </AuthShell>
  );
}
