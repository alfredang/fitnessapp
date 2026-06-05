import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
// passport-instagram has no bundled types — declared in src/types/.
import InstagramStrategy from 'passport-instagram';
import { AuthProvider } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { env, socialEnabled } from '../lib/env.js';

interface NormalizedProfile {
  provider: AuthProvider;
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

// Upsert a user from an OAuth profile, matching on (provider, providerId) or email.
async function upsertSocialUser(p: NormalizedProfile) {
  const existing =
    (await prisma.user.findFirst({
      where: { provider: p.provider, providerId: p.providerId },
    })) || (await prisma.user.findUnique({ where: { email: p.email } }));

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        provider: p.provider,
        providerId: p.providerId,
        avatarUrl: existing.avatarUrl || p.avatarUrl,
      },
    });
  }
  return prisma.user.create({
    data: {
      email: p.email,
      name: p.name,
      provider: p.provider,
      providerId: p.providerId,
      avatarUrl: p.avatarUrl,
    },
  });
}

export function configurePassport(): void {
  if (socialEnabled.google) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.google.clientId,
          clientSecret: env.google.clientSecret,
          callbackURL: `${env.serverUrl}/api/auth/google/callback`,
        },
        async (_at, _rt, profile, done) => {
          try {
            const user = await upsertSocialUser({
              provider: AuthProvider.GOOGLE,
              providerId: profile.id,
              email: profile.emails?.[0]?.value || `${profile.id}@google.local`,
              name: profile.displayName || 'Google User',
              avatarUrl: profile.photos?.[0]?.value,
            });
            done(null, user);
          } catch (e) {
            done(e as Error);
          }
        }
      )
    );
  }

  if (socialEnabled.facebook) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: env.facebook.clientId,
          clientSecret: env.facebook.clientSecret,
          callbackURL: `${env.serverUrl}/api/auth/facebook/callback`,
          profileFields: ['id', 'displayName', 'emails', 'photos'],
        },
        async (_at, _rt, profile, done) => {
          try {
            const user = await upsertSocialUser({
              provider: AuthProvider.FACEBOOK,
              providerId: profile.id,
              email:
                profile.emails?.[0]?.value || `${profile.id}@facebook.local`,
              name: profile.displayName || 'Facebook User',
              avatarUrl: profile.photos?.[0]?.value,
            });
            done(null, user);
          } catch (e) {
            done(e as Error);
          }
        }
      )
    );
  }

  if (socialEnabled.instagram) {
    passport.use(
      new (InstagramStrategy as any).Strategy(
        {
          clientID: env.instagram.clientId,
          clientSecret: env.instagram.clientSecret,
          callbackURL: `${env.serverUrl}/api/auth/instagram/callback`,
        },
        async (_at: string, _rt: string, profile: any, done: any) => {
          try {
            const user = await upsertSocialUser({
              provider: AuthProvider.INSTAGRAM,
              providerId: profile.id,
              email: `${profile.username || profile.id}@instagram.local`,
              name: profile.displayName || profile.username || 'Instagram User',
              avatarUrl: profile._json?.data?.profile_picture,
            });
            done(null, user);
          } catch (e) {
            done(e as Error);
          }
        }
      )
    );
  }
}
