import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@pulsefit.test';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

// Helper: build a Date offset from "now" by days/hours so seeded classes are upcoming.
function at(daysFromNow: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log('🌱 Seeding database...');

  // ── Admin + sample member ────────────────────────────────────────────────
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      passwordHash: adminHash,
      name: 'PulseFit Admin',
      role: Role.ADMIN,
    },
  });

  const memberHash = await bcrypt.hash('Member123!', 10);
  const member = await prisma.user.upsert({
    where: { email: 'member@pulsefit.test' },
    update: {},
    create: {
      email: 'member@pulsefit.test',
      passwordHash: memberHash,
      name: 'Jamie Member',
      role: Role.MEMBER,
      bio: 'Weekend warrior chasing a sub-25 5K.',
    },
  });

  // ── Programs ─────────────────────────────────────────────────────────────
  const programData = [
    {
      slug: 'weight-loss',
      title: 'Weight Loss Program',
      category: 'dietary',
      price: 49,
      order: 1,
      description:
        'Calorie tracking, meal recommendations and HIIT sessions designed to shed fat sustainably.',
      imageUrl:
        'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
    },
    {
      slug: 'muscle-gain',
      title: 'Muscle Gain Program',
      category: 'dietary',
      price: 59,
      order: 2,
      description:
        'Protein-focused plans, progressive overload and macronutrient tracking for lean mass.',
      imageUrl:
        'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80',
    },
    {
      slug: 'healthy-lifestyle',
      title: 'Healthy Lifestyle Program',
      category: 'dietary',
      price: 39,
      order: 3,
      description:
        'Balanced nutrition, mobility work and wellness guidance to feel great every day.',
      imageUrl:
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    },
    {
      slug: 'strength-circuit',
      title: 'Strength Circuit',
      category: 'fitness',
      price: 0,
      order: 4,
      description:
        'Full-body strength circuits with certified trainers — build power and endurance.',
      imageUrl:
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    },
    {
      slug: 'yoga-flow',
      title: 'Yoga Flow',
      category: 'fitness',
      price: 0,
      order: 5,
      description:
        'Vinyasa flows to improve flexibility, balance and mindful breathing.',
      imageUrl:
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
    },
  ];

  const programs = [];
  for (const p of programData) {
    const program = await prisma.program.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
    programs.push(program);
  }

  // ── Class sessions ───────────────────────────────────────────────────────
  const strength = programs.find((p) => p.slug === 'strength-circuit')!;
  const yoga = programs.find((p) => p.slug === 'yoga-flow')!;
  const weightLoss = programs.find((p) => p.slug === 'weight-loss')!;

  await prisma.classSession.deleteMany({});
  const classes = await prisma.$transaction([
    prisma.classSession.create({
      data: {
        programId: strength.id,
        title: 'Morning Strength Circuit',
        trainer: 'Coach Mike',
        branch: 'Downtown',
        room: 'Studio A',
        startsAt: at(1, 7),
        endsAt: at(1, 8),
        capacity: 12,
      },
    }),
    prisma.classSession.create({
      data: {
        programId: yoga.id,
        title: 'Sunset Yoga Flow',
        trainer: 'Coach Aria',
        branch: 'Riverside',
        room: 'Studio B',
        startsAt: at(2, 18),
        endsAt: at(2, 19),
        capacity: 2, // small capacity to demo auto-close
      },
    }),
    prisma.classSession.create({
      data: {
        programId: weightLoss.id,
        title: 'HIIT Burn',
        trainer: 'Coach Sam',
        branch: 'Downtown',
        room: 'Studio A',
        startsAt: at(3, 12),
        endsAt: at(3, 13),
        capacity: 15,
      },
    }),
  ]);

  // Member is enrolled + booked into the first class
  await prisma.enrollment.upsert({
    where: { userId_programId: { userId: member.id, programId: strength.id } },
    update: {},
    create: { userId: member.id, programId: strength.id },
  });
  await prisma.booking.upsert({
    where: {
      userId_classSessionId: { userId: member.id, classSessionId: classes[0].id },
    },
    update: {},
    create: { userId: member.id, classSessionId: classes[0].id },
  });

  // ── Testimonials ─────────────────────────────────────────────────────────
  await prisma.testimonial.deleteMany({});
  await prisma.testimonial.createMany({
    data: [
      {
        authorName: 'Priya S.',
        role: 'Lost 12kg in 4 months',
        quote:
          'PulseFit kept me accountable. The trainers and the app together made all the difference.',
        rating: 5,
        order: 1,
      },
      {
        authorName: 'David L.',
        role: 'Gained 6kg lean muscle',
        quote:
          'The muscle gain program is structured and the class scheduling is effortless.',
        rating: 5,
        order: 2,
      },
      {
        authorName: 'Mei T.',
        role: 'Member since 2021',
        quote:
          'I love seeing my whole week of classes in one calendar. Booking takes seconds.',
        rating: 5,
        order: 3,
      },
    ],
  });

  // ── Leads ────────────────────────────────────────────────────────────────
  await prisma.lead.deleteMany({});
  await prisma.lead.createMany({
    data: [
      {
        name: 'Alex Turner',
        email: 'alex@example.com',
        phone: '+1 555 0101',
        interest: 'Weight Loss Program',
        message: 'Interested in a free trial next week.',
      },
      {
        name: 'Sara Kim',
        email: 'sara@example.com',
        phone: '+1 555 0142',
        interest: 'Yoga Flow',
        message: 'Do you offer beginner classes?',
        status: 'CONTACTED',
      },
    ],
  });

  // ── Site content (CMS) ───────────────────────────────────────────────────
  const content: Record<string, unknown> = {
    hero: {
      eyebrow: 'All-in-one fitness companion',
      title: 'Train Smarter. Live Stronger.',
      subtitle:
        'Personalised programs, live classes and progress tracking — everything you need to reach your goals.',
      primaryCta: 'Join Now',
      secondaryCta: 'Book Free Trial',
      imageUrl:
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80',
    },
    metrics: [
      { label: 'Active Members', value: '2,400+' },
      { label: 'Weekly Classes', value: '120' },
      { label: 'Certified Trainers', value: '35' },
      { label: 'Branches', value: '6' },
    ],
    membership: [
      {
        name: 'Basic',
        price: 29,
        popular: false,
        features: ['Gym access', 'Fitness tracking', 'Mobile app'],
      },
      {
        name: 'Premium',
        price: 59,
        popular: true,
        features: [
          'Everything in Basic',
          'Group classes',
          'Diet consultation',
        ],
      },
      {
        name: 'Elite',
        price: 99,
        popular: false,
        features: [
          'Everything in Premium',
          'Personal trainer',
          'Advanced nutrition',
        ],
      },
    ],
    cta: {
      title: 'Transform Your Fitness Journey Today',
      subtitle: 'Join thousands of members getting stronger with PulseFit.',
      button: 'Get Started',
    },
    // Rich HTML block edited via the CMS WYSIWYG editor.
    welcome: {
      html: '<h2>Welcome to PulseFit</h2><p>We are a community of <strong>certified trainers</strong> and members who believe fitness should be <em>accessible, social, and fun</em>. Since 2018 we have helped thousands train smarter with science-backed programs.</p><ul><li>Personalised coaching</li><li>Flexible class scheduling</li><li>Nutrition that actually fits your life</li></ul>',
    },
    // Automation toggles for the agentic flows (managed on Admin → Settings).
    settings: {
      autoCloseEnabled: true,
      remindersEnabled: true,
    },
    contact: {
      email: 'hello@pulsefit.test',
      phone: '+1 (555) 010-2020',
      address: '88 Strong Ave, Fit City',
      founded: 2018,
      socials: {
        facebook: 'https://facebook.com',
        instagram: 'https://instagram.com',
        twitter: 'https://twitter.com',
        youtube: 'https://youtube.com',
      },
    },
  };
  for (const [key, jsonValue] of Object.entries(content)) {
    await prisma.siteContent.upsert({
      where: { key },
      update: { jsonValue: jsonValue as object },
      create: { key, jsonValue: jsonValue as object },
    });
  }

  console.log('✅ Seed complete.');
  console.log(`   Admin:  ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`   Member: member@pulsefit.test / Member123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
