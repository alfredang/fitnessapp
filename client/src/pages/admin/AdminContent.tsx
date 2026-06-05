import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save } from 'lucide-react';
import { api, apiError } from '../../lib/api';
import { Spinner } from '../../components/ui';
import { RichTextEditor } from '../../components/RichTextEditor';

// A small wrapper that owns "dirty + save" UX for a single content block.
function Section({
  title,
  description,
  children,
  onSave,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  async function save() {
    setBusy(true);
    setMsg('');
    try {
      await onSave();
      setMsg('Saved ✓');
    } catch (e) {
      setMsg(apiError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold">{title}</h3>
          {description && <p className="text-xs text-slate-400">{description}</p>}
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm text-slate-500">{msg}</span>}
          <button className="btn-primary" onClick={save} disabled={busy}>
            <Save size={16} /> {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

interface Hero {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  imageUrl: string;
}
interface Metric { label: string; value: string }
interface Tier { name: string; price: number; popular: boolean; features: string[] }
interface Cta { title: string; subtitle: string; button: string }
interface Contact {
  email: string;
  phone: string;
  address: string;
  founded: number;
  socials: Record<string, string>;
}

export default function AdminContent() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Record<string, any>>({
    queryKey: ['admin-content'],
    queryFn: async () => (await api.get('/content')).data,
  });

  const [hero, setHero] = useState<Hero>();
  const [welcome, setWelcome] = useState('');
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [membership, setMembership] = useState<Tier[]>([]);
  const [cta, setCta] = useState<Cta>();
  const [contact, setContact] = useState<Contact>();

  useEffect(() => {
    if (!data) return;
    setHero(data.hero);
    setWelcome(data.welcome?.html ?? '');
    setMetrics(data.metrics ?? []);
    setMembership(data.membership ?? []);
    setCta(data.cta);
    setContact(data.contact);
  }, [data]);

  async function put(key: string, value: unknown) {
    await api.put(`/content/${key}`, { value });
    qc.invalidateQueries({ queryKey: ['admin-content'] });
    qc.invalidateQueries({ queryKey: ['content'] });
  }

  if (isLoading || !hero || !cta || !contact) return <Spinner />;

  return (
    <div className="max-w-3xl">
      <h2 className="mb-1 text-xl font-bold">Site content (CMS)</h2>
      <p className="mb-6 text-sm text-slate-500">
        Edit the homepage content. Rich-text fields support headings, lists, links and
        raw HTML. Changes appear instantly on the public site.
      </p>

      <div className="space-y-5">
        {/* Hero */}
        <Section title="Hero" onSave={() => put('hero', hero)}>
          <Field label="Eyebrow" value={hero.eyebrow} onChange={(v) => setHero({ ...hero, eyebrow: v })} />
          <Field label="Title" value={hero.title} onChange={(v) => setHero({ ...hero, title: v })} />
          <div>
            <label className="label">Subtitle (rich text)</label>
            <RichTextEditor value={hero.subtitle} onChange={(v) => setHero({ ...hero, subtitle: v })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Primary button" value={hero.primaryCta} onChange={(v) => setHero({ ...hero, primaryCta: v })} />
            <Field label="Secondary button" value={hero.secondaryCta} onChange={(v) => setHero({ ...hero, secondaryCta: v })} />
          </div>
          <Field label="Hero image URL" value={hero.imageUrl} onChange={(v) => setHero({ ...hero, imageUrl: v })} />
        </Section>

        {/* Welcome — full rich HTML block */}
        <Section
          title="Welcome / About"
          description="A free-form rich HTML block rendered on the homepage."
          onSave={() => put('welcome', { html: welcome })}
        >
          <RichTextEditor value={welcome} onChange={setWelcome} />
        </Section>

        {/* Metrics */}
        <Section title="Metrics" description="The stat counters in the hero." onSave={() => put('metrics', metrics)}>
          {metrics.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input className="input" placeholder="Value" value={m.value}
                onChange={(e) => setMetrics(metrics.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
              <input className="input" placeholder="Label" value={m.label}
                onChange={(e) => setMetrics(metrics.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <button className="btn-ghost p-2 text-red-600" onClick={() => setMetrics(metrics.filter((_, j) => j !== i))}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button className="btn-outline" onClick={() => setMetrics([...metrics, { label: '', value: '' }])}>
            <Plus size={16} /> Add metric
          </button>
        </Section>

        {/* Membership */}
        <Section title="Membership tiers" onSave={() => put('membership', membership)}>
          {membership.map((t, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-3">
              <div className="grid grid-cols-2 gap-2">
                <input className="input" placeholder="Name" value={t.name}
                  onChange={(e) => setMembership(membership.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <input className="input" type="number" placeholder="Price" value={t.price}
                  onChange={(e) => setMembership(membership.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)))} />
              </div>
              <input className="input mt-2" placeholder="Features (comma separated)" value={t.features.join(', ')}
                onChange={(e) => setMembership(membership.map((x, j) => (j === i ? { ...x, features: e.target.value.split(',').map((s) => s.trim()) } : x)))} />
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={t.popular}
                  onChange={(e) => setMembership(membership.map((x, j) => (j === i ? { ...x, popular: e.target.checked } : x)))} />
                Most popular
                <button className="ml-auto btn-ghost p-1 text-red-600" onClick={() => setMembership(membership.filter((_, j) => j !== i))}>
                  <Trash2 size={15} />
                </button>
              </label>
            </div>
          ))}
          <button className="btn-outline" onClick={() => setMembership([...membership, { name: '', price: 0, popular: false, features: [] }])}>
            <Plus size={16} /> Add tier
          </button>
        </Section>

        {/* CTA */}
        <Section title="Call-to-action banner" onSave={() => put('cta', cta)}>
          <Field label="Title" value={cta.title} onChange={(v) => setCta({ ...cta, title: v })} />
          <div>
            <label className="label">Subtitle (rich text)</label>
            <RichTextEditor value={cta.subtitle} onChange={(v) => setCta({ ...cta, subtitle: v })} />
          </div>
          <Field label="Button label" value={cta.button} onChange={(v) => setCta({ ...cta, button: v })} />
        </Section>

        {/* Contact / footer */}
        <Section title="Contact & footer" onSave={() => put('contact', contact)}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email" value={contact.email} onChange={(v) => setContact({ ...contact, email: v })} />
            <Field label="Phone" value={contact.phone} onChange={(v) => setContact({ ...contact, phone: v })} />
          </div>
          <Field label="Address" value={contact.address} onChange={(v) => setContact({ ...contact, address: v })} />
          <Field label="Founded year" value={String(contact.founded)} onChange={(v) => setContact({ ...contact, founded: Number(v) || contact.founded })} />
          <div className="grid grid-cols-2 gap-4">
            {(['facebook', 'instagram', 'twitter', 'youtube'] as const).map((s) => (
              <Field key={s} label={s} value={contact.socials?.[s] ?? ''}
                onChange={(v) => setContact({ ...contact, socials: { ...contact.socials, [s]: v } })} />
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label capitalize">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
