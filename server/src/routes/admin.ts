import { Router } from 'express';
import { z } from 'zod';
import { ClassStatus, LeadStatus, Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/http.js';
import { requireRole } from '../middleware/auth.js';
import { runReminderSweep } from '../automation/reminders.js';
import { getSettings, updateSettings } from '../lib/settings.js';

export const adminRouter = Router();
adminRouter.use(requireRole(Role.ADMIN));

// ── Automation settings (toggle the agentic flows) ─────────────────────────
adminRouter.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    res.json(await getSettings());
  })
);

const settingsSchema = z.object({
  autoCloseEnabled: z.boolean().optional(),
  remindersEnabled: z.boolean().optional(),
});
adminRouter.put(
  '/settings',
  asyncHandler(async (req, res) => {
    const patch = settingsSchema.parse(req.body);
    res.json(await updateSettings(patch));
  })
);

// Dashboard summary counts.
adminRouter.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [members, programs, classes, openClasses, leads, newLeads] =
      await Promise.all([
        prisma.user.count({ where: { role: Role.MEMBER } }),
        prisma.program.count(),
        prisma.classSession.count(),
        prisma.classSession.count({ where: { status: ClassStatus.OPEN } }),
        prisma.lead.count(),
        prisma.lead.count({ where: { status: LeadStatus.NEW } }),
      ]);
    res.json({ members, programs, classes, openClasses, leads, newLeads });
  })
);

// Manually trigger the reminder sweep (handy for demos/testing).
adminRouter.post(
  '/run-reminders',
  asyncHandler(async (_req, res) => {
    const sent = await runReminderSweep();
    res.json({ sent });
  })
);
