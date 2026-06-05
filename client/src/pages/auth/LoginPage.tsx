import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { apiError } from '../../lib/api';
import { AuthShell, SocialButtons } from './AuthShell';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { register, handleSubmit } = useForm<{ email: string; password: string }>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate(user.role === 'ADMIN' ? '/admin' : '/app', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const err = params.get('error');
    if (err) setError(err.replace(/_/g, ' '));
  }, [params]);

  async function onSubmit(values: { email: string; password: string }) {
    setError('');
    setBusy(true);
    try {
      await login(values.email, values.password);
    } catch (e) {
      setError(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-semibold text-brand-600">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" {...register('email', { required: true })} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" {...register('password', { required: true })} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="btn-primary w-full">
          {busy ? 'Signing in…' : 'Log in'}
        </button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" /> OR <div className="h-px flex-1 bg-slate-200" />
      </div>
      <SocialButtons />
      <p className="mt-4 rounded-lg bg-slate-50 p-3 text-center text-xs text-slate-500">
        Demo admin: <b>admin@pulsefit.test</b> / <b>Admin123!</b>
        <br />
        Demo member: <b>member@pulsefit.test</b> / <b>Member123!</b>
      </p>
    </AuthShell>
  );
}
