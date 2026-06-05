import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/http.js';
import { requireRole } from '../middleware/auth.js';

export const testimonialsRouter = Router();

// Public — published testimonials (admins see all with ?all=1).
testimonialsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const showAll = req.query.all === '1' && req.user?.role === Role.ADMIN;
    const items = await prisma.testimonial.findMany({
      where: showAll ? {} : { isPublished: true },
      orderBy: { order: 'asc' },
    });
    res.json(items);
  })
);

const upsertSchema = z.object({
  authorName: z.string().min(2),
  role: z.string().optional().or(z.literal('')),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  quote: z.string().min(4),
  rating: z.number().int().min(1).max(5).default(5),
  isPublished: z.boolean().default(true),
  order: z.number().int().default(0),
});

testimonialsRouter.post(
  '/',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const data = upsertSchema.parse(req.body);
    const item = await prisma.testimonial.create({ data });
    res.status(201).json(item);
  })
);

testimonialsRouter.put(
  '/:id',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const data = upsertSchema.partial().parse(req.body);
    const item = await prisma.testimonial.update({ where: { id: req.params.id }, data });
    res.json(item);
  })
);

testimonialsRouter.delete(
  '/:id',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    await prisma.testimonial.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);
