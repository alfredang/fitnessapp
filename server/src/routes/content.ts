import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, notFound } from '../lib/http.js';
import { requireRole } from '../middleware/auth.js';

export const contentRouter = Router();

// Public — all site content as a { key: value } map for the frontend.
contentRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.siteContent.findMany();
    const map: Record<string, unknown> = {};
    for (const r of rows) map[r.key] = r.jsonValue;
    res.json(map);
  })
);

contentRouter.get(
  '/:key',
  asyncHandler(async (req, res) => {
    const row = await prisma.siteContent.findUnique({ where: { key: req.params.key } });
    if (!row) throw notFound('Content key not found');
    res.json(row.jsonValue);
  })
);

// Admin — upsert a content block (CMS editor).
const upsertSchema = z.object({ value: z.unknown() });
contentRouter.put(
  '/:key',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const { value } = upsertSchema.parse(req.body);
    const row = await prisma.siteContent.upsert({
      where: { key: req.params.key },
      update: { jsonValue: value as object },
      create: { key: req.params.key, jsonValue: value as object },
    });
    res.json(row.jsonValue);
  })
);
