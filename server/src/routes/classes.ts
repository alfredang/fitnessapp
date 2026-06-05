import { Router } from 'express';
import { z } from 'zod';
import { BookingStatus, ClassStatus, Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, notFound } from '../lib/http.js';
import { requireRole } from '../middleware/auth.js';
import { setClassStatus } from '../automation/booking.js';

export const classesRouter = Router();

// Attach a live "booked" count + spotsLeft to each session.
async function withCounts(sessions: { id: string; capacity: number }[]) {
  const counts = await prisma.booking.groupBy({
    by: ['classSessionId'],
    where: {
      status: BookingStatus.BOOKED,
      classSessionId: { in: sessions.map((s) => s.id) },
    },
    _count: { _all: true },
  });
  const map = new Map(counts.map((c) => [c.classSessionId, c._count._all]));
  return sessions.map((s) => {
    const booked = map.get(s.id) ?? 0;
    return { ...s, booked, spotsLeft: Math.max(0, s.capacity - booked) };
  });
}

// Public — list upcoming classes (calendar feed). Optional ?programId / ?from / ?to.
classesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { programId, from, to } = req.query as Record<string, string>;
    const sessions = await prisma.classSession.findMany({
      where: {
        ...(programId ? { programId } : {}),
        ...(from || to
          ? { startsAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
          : {}),
      },
      include: { program: { select: { title: true, slug: true, category: true } } },
      orderBy: { startsAt: 'asc' },
    });
    res.json(await withCounts(sessions as any));
  })
);

classesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const session = await prisma.classSession.findUnique({
      where: { id: req.params.id },
      include: { program: true },
    });
    if (!session) throw notFound('Class not found');
    const [withCount] = await withCounts([session as any]);
    res.json({ ...session, ...withCount });
  })
);

const upsertSchema = z.object({
  programId: z.string().min(1),
  title: z.string().min(2),
  trainer: z.string().min(1),
  branch: z.string().min(1),
  room: z.string().optional().or(z.literal('')),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  capacity: z.number().int().min(1),
  status: z.nativeEnum(ClassStatus).optional(),
});

classesRouter.post(
  '/',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const data = upsertSchema.parse(req.body);
    const session = await prisma.classSession.create({ data });
    res.status(201).json(session);
  })
);

classesRouter.put(
  '/:id',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const data = upsertSchema.partial().parse(req.body);
    const session = await prisma.classSession.update({
      where: { id: req.params.id },
      data,
    });
    res.json(session);
  })
);

classesRouter.delete(
  '/:id',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    await prisma.classSession.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

// Admin manual close / reopen / cancel.
const statusSchema = z.object({ status: z.nativeEnum(ClassStatus) });
classesRouter.patch(
  '/:id/status',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const { status } = statusSchema.parse(req.body);
    const session = await setClassStatus(req.params.id, status);
    res.json(session);
  })
);
