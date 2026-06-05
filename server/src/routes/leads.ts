import { Router } from 'express';
import { z } from 'zod';
import { LeadStatus, Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/http.js';
import { requireRole } from '../middleware/auth.js';

export const leadsRouter = Router();

// Public — lead-magnet form submission (replaces the old enquiry/booking form).
const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().or(z.literal('')),
  interest: z.string().optional().or(z.literal('')),
  message: z.string().optional().or(z.literal('')),
  source: z.string().optional(),
});

leadsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const lead = await prisma.lead.create({ data });
    res.status(201).json({ id: lead.id, ok: true });
  })
);

// Admin — manage leads.
leadsRouter.get(
  '/',
  requireRole(Role.ADMIN),
  asyncHandler(async (_req, res) => {
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(leads);
  })
);

const statusSchema = z.object({ status: z.nativeEnum(LeadStatus) });
leadsRouter.patch(
  '/:id',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const { status } = statusSchema.parse(req.body);
    const lead = await prisma.lead.update({ where: { id: req.params.id }, data: { status } });
    res.json(lead);
  })
);

leadsRouter.delete(
  '/:id',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    await prisma.lead.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);
