import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { api, apiError } from '../../lib/api';
import type { Program } from '../../lib/types';

interface LeadFields {
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
}

export default function LeadForm({ programs }: { programs: Program[] }) {
  const { register, handleSubmit, reset, formState } = useForm<LeadFields>();
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(values: LeadFields) {
    setError('');
    try {
      await api.post('/leads', { ...values, source: 'website' });
      setDone(true);
      reset();
    } catch (e) {
      setError(apiError(e));
    }
  }

  if (done) {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 text-green-500" size={48} />
        <h3 className="text-xl font-bold">You're on the list! 🎉</h3>
        <p className="mt-2 text-slate-600">
          Our team will reach out shortly with your free training guide and trial details.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/register" className="btn-primary">
            Create your account
          </Link>
          <button className="btn-outline" onClick={() => setDone(false)}>
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card mx-auto max-w-xl p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Full name</label>
          <input className="input" {...register('name', { required: true })} placeholder="Jane Doe" />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" {...register('email', { required: true })} placeholder="jane@email.com" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" {...register('phone')} placeholder="+1 555 0100" />
        </div>
        <div>
          <label className="label">I'm interested in</label>
          <select className="input" {...register('interest')}>
            <option value="">Select a program…</option>
            {programs.map((p) => (
              <option key={p.id} value={p.title}>
                {p.title}
              </option>
            ))}
            <option value="Free Trial">Free Trial</option>
          </select>
        </div>
      </div>
      <div className="mt-4">
        <label className="label">Anything else?</label>
        <textarea className="input" rows={3} {...register('message')} placeholder="Tell us your goals…" />
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={formState.isSubmitting} className="btn-primary mt-5 w-full">
        {formState.isSubmitting ? 'Sending…' : 'Get My Free Guide & Trial'}
      </button>
      <p className="mt-3 text-center text-xs text-slate-400">
        No spam. We'll only use your details to help you start training.
      </p>
    </form>
  );
}
