import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Role, type User } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { env } from '../lib/env.js';
import { asyncHandler, badRequest, unauthorized } from '../lib/http.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const usersRouter = Router();

// Hold the uploaded file in memory; we then persist it to Vercel Blob in
// production, or to the local uploads/ folder during development.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// Persist an avatar and return its public URL. Uses Vercel Blob when a token is
// configured (production); otherwise falls back to the local uploads/ folder.
async function storeAvatar(
  userId: string,
  file: Express.Multer.File
): Promise<string> {
  const ext = path.extname(file.originalname).toLowerCase() || '.png';
  const key = `avatars/${userId}-${Date.now()}${ext}`;

  if (env.blobToken) {
    const { put } = await import('@vercel/blob');
    const blob = await put(key, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
      token: env.blobToken,
    });
    return blob.url;
  }

  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  const filename = `${userId}-${Date.now()}${ext}`;
  fs.writeFileSync(path.join(uploadsDir, filename), file.buffer);
  return `${env.serverUrl}/uploads/${filename}`;
}

function publicUser(u: User) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    bio: u.bio,
    avatarUrl: u.avatarUrl,
    phone: u.phone,
    provider: u.provider,
  };
}

// ── Profile ────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(500).optional().or(z.literal('')),
  phone: z.string().max(40).optional().or(z.literal('')),
});

usersRouter.put(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = profileSchema.parse(req.body);
    const user = await prisma.user.update({ where: { id: req.user!.id }, data });
    res.json(publicUser(user));
  })
);

usersRouter.post(
  '/me/avatar',
  requireAuth,
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw badRequest('No image uploaded');
    const avatarUrl = await storeAvatar(req.user!.id, req.file);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl },
    });
    res.json(publicUser(user));
  })
);

const passwordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6),
});

usersRouter.post(
  '/me/password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = passwordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw unauthorized();
    // Local users must confirm their current password; social users can set one.
    if (user.passwordHash) {
      if (!currentPassword) throw badRequest('Current password required');
      const ok = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!ok) throw badRequest('Current password is incorrect');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    res.json({ ok: true });
  })
);

// ── Admin — members list ─────────────────────────────────────────────────
usersRouter.get(
  '/',
  requireRole(Role.ADMIN),
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { bookings: true, enrollments: true } } },
    });
    res.json(
      users.map((u) => ({
        ...publicUser(u),
        createdAt: u.createdAt,
        bookings: u._count.bookings,
        enrollments: u._count.enrollments,
      }))
    );
  })
);
