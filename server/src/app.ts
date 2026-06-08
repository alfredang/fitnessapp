import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import path from 'node:path';
import { env } from './lib/env.js';
import { attachUser } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { configurePassport } from './auth/passport.js';
import { authRouter } from './auth/routes.js';
import { programsRouter } from './routes/programs.js';
import { classesRouter } from './routes/classes.js';
import { bookingsRouter } from './routes/bookings.js';
import { testimonialsRouter } from './routes/testimonials.js';
import { leadsRouter } from './routes/leads.js';
import { contentRouter } from './routes/content.js';
import { usersRouter } from './routes/users.js';
import { adminRouter } from './routes/admin.js';
import { runReminderSweep } from './automation/reminders.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      // Allow the configured client URL plus any Vercel deployment domain
      // (production + previews). Same-origin requests have no Origin header.
      origin: (origin, cb) => {
        if (!origin || origin === env.clientUrl || /\.vercel\.app$/.test(new URL(origin).hostname)) {
          return cb(null, true);
        }
        cb(null, false);
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(passport.initialize());
  configurePassport();
  app.use(attachUser);

  // Serve uploaded avatars.
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // Vercel Cron hits this hourly (see vercel.json) to run the reminder sweep —
  // the serverless replacement for the local node-cron scheduler. When
  // CRON_SECRET is set, Vercel sends it as a Bearer token; reject anything else.
  app.get('/api/cron/reminders', async (req, res, next) => {
    try {
      if (env.cronSecret) {
        const auth = req.headers.authorization;
        if (auth !== `Bearer ${env.cronSecret}`) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
      }
      const sent = await runReminderSweep();
      res.json({ ok: true, sent });
    } catch (err) {
      next(err);
    }
  });

  app.use('/api/auth', authRouter);
  app.use('/api/programs', programsRouter);
  app.use('/api/classes', classesRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/testimonials', testimonialsRouter);
  app.use('/api/leads', leadsRouter);
  app.use('/api/content', contentRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/admin', adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
