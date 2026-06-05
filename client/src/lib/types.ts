export type Role = 'ADMIN' | 'MEMBER';
export type ClassStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'CONVERTED';
export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'FACEBOOK' | 'INSTAGRAM';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  bio?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  provider: AuthProvider;
  isImpersonating?: boolean;
}

export interface Program {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl?: string | null;
  category: string;
  price: number;
  isPublished: boolean;
  order: number;
}

export interface ClassSession {
  id: string;
  programId: string;
  title: string;
  trainer: string;
  branch: string;
  room?: string | null;
  startsAt: string;
  endsAt: string;
  capacity: number;
  status: ClassStatus;
  booked?: number;
  spotsLeft?: number;
  program?: { title: string; slug: string; category: string };
}

export interface Testimonial {
  id: string;
  authorName: string;
  role?: string | null;
  avatarUrl?: string | null;
  quote: string;
  rating: number;
  isPublished: boolean;
  order: number;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  interest?: string | null;
  message?: string | null;
  source: string;
  status: LeadStatus;
  createdAt: string;
}

export interface Booking {
  id: string;
  classSessionId: string;
  status: string;
  classSession: ClassSession & { program: Program };
}

export interface Member extends User {
  createdAt: string;
  bookings: number;
  enrollments: number;
}

export interface SiteContent {
  hero?: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    imageUrl: string;
  };
  metrics?: { label: string; value: string }[];
  membership?: { name: string; price: number; popular: boolean; features: string[] }[];
  cta?: { title: string; subtitle: string; button: string };
  contact?: {
    email: string;
    phone: string;
    address: string;
    founded: number;
    socials: Record<string, string>;
  };
}
