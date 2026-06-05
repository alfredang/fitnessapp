import { Router } from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AuthProvider, Role, type User } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { env, socialEnabled } from '../lib/env.js';
import { clearAuthCookie, setAuthCookie, signToken } from '../lib/jwt.js';
import { asyncHandler, badRequest, unauthorized } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

// Shape the user object returned to the client (never expose passwordHash).
function publicUser(u: User, impersonatorId?: string) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    bio: u.bio,
    avatarUrl: u.avatarUrl,
    phone: u.phone,
    provider: u.provider,
    isImpersonating: !!impersonatorId,
  };
}

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw badRequest('Email already registered');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: Role.MEMBER, provider: AuthProvider.LOCAL },
    });
    const token = signToken({ sub: user.id, role: user.role });
    setAuthCookie(res, token);
    res.status(201).json({ user: publicUser(user) });
  })
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) throw unauthorized('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw unauthorized('Invalid credentials');
    const token = signToken({ sub: user.id, role: user.role });
    setAuthCookie(res, token);
    res.json({ user: publicUser(user) });
  })
);

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw unauthorized();
    res.json({ user: publicUser(user, req.user!.impersonatorId) });
  })
);

// ── View-as-member (admin impersonation) ──────────────────────────────────
authRouter.post(
  '/impersonate',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user!.role !== Role.ADMIN) throw unauthorized('Admins only');
    const admin = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!admin) throw unauthorized();
    // Issue a MEMBER-scoped token but remember who the admin is.
    const token = signToken({
      sub: admin.id,
      role: Role.MEMBER,
      impersonatorId: admin.id,
    });
    setAuthCookie(res, token);
    res.json({ user: publicUser({ ...admin, role: Role.MEMBER }, admin.id) });
  })
);

authRouter.post(
  '/stop-impersonate',
  requireAuth,
  asyncHandler(async (req, res) => {
    const impersonatorId = req.user!.impersonatorId;
    if (!impersonatorId) throw badRequest('Not impersonating');
    const admin = await prisma.user.findUnique({ where: { id: impersonatorId } });
    if (!admin) throw unauthorized();
    const token = signToken({ sub: admin.id, role: admin.role });
    setAuthCookie(res, token);
    res.json({ user: publicUser(admin) });
  })
);

// ── Which social providers are configured (drives the login buttons) ───────
// `devMock` is true in non-prod when a provider has no real keys — the button
// still works, simulating the login so the flow is fully testable.
authRouter.get('/providers', (_req, res) => {
  res.json({ ...socialEnabled, devMock: env.nodeEnv !== 'production' });
});

// Dev-only mock: lets the social buttons complete a real login flow without
// requiring OAuth credentials. Active only outside production AND when the
// provider's real keys are absent. Creates/reuses a demo social account.
async function devMockLogin(
  provider: 'google' | 'facebook' | 'instagram',
  res: Parameters<typeof setAuthCookie>[0]
) {
  const providerEnum = provider.toUpperCase() as AuthProvider;
  const email = `${provider}.demo@pulsefit.test`;
  const name = `${provider[0].toUpperCase()}${provider.slice(1)} Demo User`;
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, role: Role.MEMBER, provider: providerEnum, providerId: `mock-${provider}` },
  });
  const token = signToken({ sub: user.id, role: user.role });
  setAuthCookie(res, token);
}

// ── Social OAuth routes ────────────────────────────────────────────────────
function mountSocial(provider: 'google' | 'facebook' | 'instagram', scope: string[]) {
  authRouter.get(`/${provider}`, asyncHandler(async (req, res, next) => {
    if (!socialEnabled[provider]) {
      // No real keys: simulate the login in dev, otherwise show a clear message.
      if (env.nodeEnv !== 'production') {
        await devMockLogin(provider, res);
        return res.redirect(`${env.clientUrl}/app`);
      }
      return res.redirect(
        `${env.clientUrl}/login?error=${provider}_not_configured`
      );
    }
    passport.authenticate(provider, { scope, session: false })(req, res, next);
  }));

  authRouter.get(
    `/${provider}/callback`,
    (req, res, next) => {
      passport.authenticate(provider, { session: false, failureRedirect: `${env.clientUrl}/login?error=oauth_failed` })(
        req,
        res,
        next
      );
    },
    (req, res) => {
      const user = req.user as User;
      const token = signToken({ sub: user.id, role: user.role });
      setAuthCookie(res, token);
      res.redirect(`${env.clientUrl}/app`);
    }
  );
}

mountSocial('google', ['profile', 'email']);
mountSocial('facebook', ['email']);
mountSocial('instagram', ['basic']);
