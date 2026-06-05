import { Router } from 'express';
import { z } from 'zod';
import { BookingStatus, EnrollmentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { cancelBooking, createBooking } from '../automation/booking.js';

export const bookingsRouter = Router();
bookingsRouter.use(requireAuth);

// ── Class bookings ─────────────────────────────────────────────────────────
const bookSchema = z.object({ classSessionId: z.string().min(1) });

bookingsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { classSessionId } = bookSchema.parse(req.body);
    const result = await createBooking(req.user!.id, classSessionId);
    res.status(201).json(result);
  })
);

bookingsRouter.delete(
  '/:classSessionId',
  asyncHandler(async (req, res) => {
    const result = await cancelBooking(req.user!.id, req.params.classSessionId);
    res.json(result);
  })
);

// My bookings (upcoming + past) for the calendar.
bookingsRouter.get(
  '/mine',
  asyncHandler(async (req, res) => {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user!.id, status: BookingStatus.BOOKED },
      include: { classSession: { include: { program: true } } },
      orderBy: { classSession: { startsAt: 'asc' } },
    });
    res.json(bookings);
  })
);

// ── Program enrollments ────────────────────────────────────────────────────
const enrollSchema = z.object({ programId: z.string().min(1) });

bookingsRouter.post(
  '/enroll',
  asyncHandler(async (req, res) => {
    const { programId } = enrollSchema.parse(req.body);
    const enrollment = await prisma.enrollment.upsert({
      where: { userId_programId: { userId: req.user!.id, programId } },
      update: { status: EnrollmentStatus.ACTIVE },
      create: { userId: req.user!.id, programId },
      include: { program: true },
    });
    res.status(201).json(enrollment);
  })
);

bookingsRouter.delete(
  '/enroll/:programId',
  asyncHandler(async (req, res) => {
    await prisma.enrollment.updateMany({
      where: { userId: req.user!.id, programId: req.params.programId },
      data: { status: EnrollmentStatus.CANCELLED },
    });
    res.json({ ok: true });
  })
);

bookingsRouter.get(
  '/enrollments',
  asyncHandler(async (req, res) => {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.user!.id, status: EnrollmentStatus.ACTIVE },
      include: { program: { include: { classes: { orderBy: { startsAt: 'asc' } } } } },
    });
    res.json(enrollments);
  })
);
