import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Check,
  Dumbbell,
  Facebook,
  Instagram,
  Star,
  Twitter,
  Youtube,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { Program, SiteContent, Testimonial, ClassSession } from '../../lib/types';
import { formatClassTime, money } from '../../lib/format';
import LeadForm from './LeadForm';

export default function HomePage() {
  const { data: content } = useQuery<SiteContent>({
    queryKey: ['content'],
    queryFn: async () => (await api.get('/content')).data,
  });
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['programs'],
    queryFn: async () => (await api.get('/programs')).data,
  });
  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ['testimonials'],
    queryFn: async () => (await api.get('/testimonials')).data,
  });
  const { data: classes = [] } = useQuery<ClassSession[]>({
    queryKey: ['classes'],
    queryFn: async () => (await api.get('/classes')).data,
  });

  const hero = content?.hero;
  const metrics = content?.metrics ?? [];
  const membership = content?.membership ?? [];
  const cta = content?.cta;
  const contact = content?.contact;
  const welcomeHtml = (content as any)?.welcome?.html as string | undefined;
  const dietary = programs.filter((p) => p.category === 'dietary');

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2">
          <div>
            <span className="badge bg-brand-600/20 text-brand-300">
              {hero?.eyebrow ?? 'All-in-one fitness companion'}
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
              {hero?.title ?? 'Train Smarter. Live Stronger.'}
            </h1>
            <div
              className="rich-content mt-4 max-w-md text-slate-300"
              dangerouslySetInnerHTML={{ __html: hero?.subtitle ?? '' }}
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#contact" className="btn-primary">
                {hero?.primaryCta ?? 'Join Now'}
              </a>
              <a href="#contact" className="btn-outline bg-transparent text-white">
                {hero?.secondaryCta ?? 'Book Free Trial'}
              </a>
            </div>
            <div className="mt-10 grid max-w-md grid-cols-2 gap-4 sm:grid-cols-4">
              {metrics.map((m) => (
                <div key={m.label}>
                  <div className="text-2xl font-extrabold text-brand-400">{m.value}</div>
                  <div className="text-xs text-slate-400">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
          {hero?.imageUrl && (
            <img
              src={hero.imageUrl}
              alt="Training"
              className="hidden rounded-2xl object-cover shadow-2xl md:block md:h-96 md:w-full"
            />
          )}
        </div>
      </section>

      {/* Membership */}
      <section id="membership" className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading
          eyebrow="Membership"
          title="Choose your plan"
          subtitle="Flexible plans designed to fit your goals and budget."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {membership.map((tier) => (
            <div
              key={tier.name}
              className={`card relative p-7 ${tier.popular ? 'ring-2 ring-brand-500' : ''}`}
            >
              {tier.popular && (
                <span className="badge absolute -top-3 left-7 bg-brand-600 text-white">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-bold">{tier.name}</h3>
              <div className="mt-2 text-4xl font-extrabold">
                ${tier.price}
                <span className="text-base font-medium text-slate-400">/mo</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check size={16} className="text-brand-600" /> {f}
                  </li>
                ))}
              </ul>
              <a href="#contact" className="btn-primary mt-7 w-full">
                Join Now
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Welcome — rich HTML from the CMS */}
      {welcomeHtml && (
        <section className="bg-white py-16">
          <div
            className="rich-content mx-auto max-w-3xl px-4 text-slate-700"
            dangerouslySetInnerHTML={{ __html: welcomeHtml }}
          />
        </section>
      )}

      {/* Classes */}
      <section id="classes" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            eyebrow="Classes"
            title="Find your favorite workout"
            subtitle="Led by certified trainers across all our branches."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.slice(0, 6).map((c) => (
              <div key={c.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <span className="badge bg-brand-50 text-brand-700">{c.program?.title}</span>
                  <span className="text-xs text-slate-400">{c.branch}</span>
                </div>
                <h3 className="mt-3 font-bold">{c.title}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {formatClassTime(c.startsAt, c.endsAt)}
                </p>
                <p className="mt-2 text-sm text-slate-600">with {c.trainer}</p>
                <div className="mt-3 text-xs font-medium text-slate-400">
                  {c.status === 'OPEN' ? `${c.spotsLeft} spots left` : 'Fully booked'}
                </div>
              </div>
            ))}
            {classes.length === 0 && (
              <p className="text-slate-400">Classes coming soon.</p>
            )}
          </div>
        </div>
      </section>

      {/* Dietary Programs */}
      <section id="programs" className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading
          eyebrow="Dietary Programs"
          title="Eat well, perform better"
          subtitle="Nutrition plans tailored to your goals."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {dietary.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              {p.imageUrl && (
                <img src={p.imageUrl} alt={p.title} className="h-44 w-full object-cover" />
              )}
              <div className="p-6">
                <h3 className="font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{p.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-bold text-brand-600">{money(p.price)}</span>
                  <a href="#contact" className="btn-outline">
                    Enroll
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tracking dashboard mockup */}
      <section className="bg-ink-900 py-20 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
          <div>
            <SectionHeading
              dark
              eyebrow="Tracking"
              title="Your progress, beautifully visualized"
              subtitle="Steps, calories, workout duration, water intake, weight and BMI — all in one dashboard."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Daily Steps', value: '8,420' },
              { label: 'Calories Burned', value: '640' },
              { label: 'Workout', value: '52 min' },
              { label: 'Water Intake', value: '2.1 L' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/5 p-5">
                <Activity className="text-brand-400" size={20} />
                <div className="mt-3 text-2xl font-extrabold">{s.value}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading
          eyebrow="Testimonials"
          title="Real members, real results"
          subtitle="Hear from the PulseFit community."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.id} className="card p-6">
              <div className="flex gap-0.5 text-brand-500">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-700">“{t.quote}”</p>
              <div className="mt-5 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">
                  {t.authorName[0]}
                </span>
                <div>
                  <div className="text-sm font-bold">{t.authorName}</div>
                  <div className="text-xs text-slate-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lead magnet / contact */}
      <section id="contact" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            eyebrow="Get Started"
            title="Claim your free guide + trial"
            subtitle="Drop your details and we'll send a personalized starter plan and book your free trial."
          />
          <div className="mt-10">
            <LeadForm programs={programs} />
          </div>
        </div>
      </section>

      {/* CTA */}
      {cta && (
        <section className="bg-brand-600 py-16 text-center text-white">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-3xl font-extrabold">{cta.title}</h2>
            <div
              className="rich-content mt-3 text-brand-50"
              dangerouslySetInnerHTML={{ __html: cta.subtitle ?? '' }}
            />
            <a href="#contact" className="btn mt-7 bg-white text-brand-700 hover:bg-brand-50">
              {cta.button}
            </a>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-ink-900 py-12 text-slate-400">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-extrabold text-white">
              <Dumbbell size={18} /> PulseFit
            </div>
            <p className="mt-3 text-sm">
              Established {contact?.founded ?? 2018}. Train smarter, live stronger.
            </p>
            <div className="mt-4 flex gap-3">
              <Facebook size={18} />
              <Instagram size={18} />
              <Twitter size={18} />
              <Youtube size={18} />
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#membership">Membership</a></li>
              <li><a href="#classes">Classes</a></li>
              <li><a href="#programs">Programs</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-white">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#">Careers</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#testimonials">Testimonials</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-white">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>{contact?.email}</li>
              <li>{contact?.phone}</li>
              <li>{contact?.address}</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl border-t border-white/10 px-4 pt-6 text-center text-xs">
          <p>© {contact?.founded ?? 2018} PulseFit. Built with the Tertiary Infotech Academy stack.</p>
          <p className="mt-1">
            Powered by{' '}
            <a
              href="https://www.tertiaryinfotech.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white hover:text-brand-400"
            >
              Tertiary Infotech Academy Pte Ltd
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  dark,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  dark?: boolean;
}) {
  return (
    <div className="max-w-2xl">
      <div className="text-sm font-bold uppercase tracking-wide text-brand-500">{eyebrow}</div>
      <h2 className={`mt-2 text-3xl font-extrabold ${dark ? 'text-white' : 'text-ink-900'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-3 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{subtitle}</p>
      )}
    </div>
  );
}
