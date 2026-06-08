import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AuthProvider, Prisma, Role, type User } from '@prisma/client';
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

// ── Admin — create a member ───────────────────────────────────────────────
const adminCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role).optional(),
  phone: z.string().max(40).optional().or(z.literal('')),
});

usersRouter.post(
  '/',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const data = adminCreateSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw badRequest('Email already registered');
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role ?? Role.MEMBER,
        phone: data.phone || null,
        provider: AuthProvider.LOCAL,
      },
    });
    res.status(201).json(publicUser(user));
  })
);

// ── Admin — update a member ───────────────────────────────────────────────
const adminUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(Role).optional(),
  phone: z.string().max(40).optional().or(z.literal('')),
  // Optional — only changes the password when a non-empty value is sent.
  password: z.string().min(6).optional().or(z.literal('')),
});

usersRouter.put(
  '/:id',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const data = adminUpdateSchema.parse(req.body);
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) throw badRequest('Member not found');
    if (data.email && data.email !== target.email) {
      const dupe = await prisma.user.findUnique({ where: { email: data.email } });
      if (dupe) throw badRequest('Email already in use');
    }
    const patch: Prisma.UserUpdateInput = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.email !== undefined) patch.email = data.email;
    if (data.role !== undefined) patch.role = data.role;
    if (data.phone !== undefined) patch.phone = data.phone === '' ? null : data.phone;
    if (data.password) patch.passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.update({ where: { id: target.id }, data: patch });
    res.json(publicUser(user));
  })
);

// ── Admin — delete a member ───────────────────────────────────────────────
usersRouter.delete(
  '/:id',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user!.id) {
      throw badRequest('You cannot delete your own account');
    }
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) throw badRequest('Member not found');
    await prisma.user.delete({ where: { id: target.id } });
    res.json({ ok: true });
  })
);
