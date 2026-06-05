import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, notFound } from '../lib/http.js';
import { requireRole } from '../middleware/auth.js';

export const programsRouter = Router();

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Public — list published programs (admins see all via ?all=1).
programsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const showAll = req.query.all === '1' && req.user?.role === Role.ADMIN;
    const programs = await prisma.program.findMany({
      where: showAll ? {} : { isPublished: true },
      orderBy: { order: 'asc' },
    });
    res.json(programs);
  })
);

programsRouter.get(
  '/:idOrSlug',
  asyncHandler(async (req, res) => {
    const { idOrSlug } = req.params;
    const program = await prisma.program.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: { classes: { orderBy: { startsAt: 'asc' } } },
    });
    if (!program) throw notFound('Program not found');
    res.json(program);
  })
);

const upsertSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(1),
  imageUrl: z.string().url().optional().or(z.literal('')),
  category: z.enum(['fitness', 'dietary']).default('fitness'),
  price: z.number().min(0).default(0),
  isPublished: z.boolean().default(true),
  order: z.number().int().default(0),
});

programsRouter.post(
  '/',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const data = upsertSchema.parse(req.body);
    const program = await prisma.program.create({
      data: { ...data, slug: slugify(data.title) + '-' + Date.now().toString(36) },
    });
    res.status(201).json(program);
  })
);

programsRouter.put(
  '/:id',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const data = upsertSchema.partial().parse(req.body);
    const program = await prisma.program.update({
      where: { id: req.params.id },
      data,
    });
    res.json(program);
  })
);

programsRouter.delete(
  '/:id',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    await prisma.program.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);
