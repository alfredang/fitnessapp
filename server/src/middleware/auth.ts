import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { env } from '../lib/env.js';
import { verifyToken } from '../lib/jwt.js';
import { forbidden, unauthorized } from '../lib/http.js';

export interface AuthUser {
  id: string;
  role: Role;
  impersonatorId?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // Augment Passport's User type so req.user carries our auth fields.
    // (Passport sets req.user to the full Prisma user during OAuth callbacks,
    // which is a structural superset of AuthUser.)
    interface User extends AuthUser {}
  }
}

// Populates req.user if a valid token cookie is present; never throws.
export function attachUser(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[env.cookieName];
  if (token) {
    try {
      const payload = verifyToken(token);
      req.user = {
        id: payload.sub,
        role: payload.role,
        impersonatorId: payload.impersonatorId,
      };
    } catch {
      // invalid/expired token — treat as anonymous
    }
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) return next(unauthorized('Please log in'));
  next();
}

export function requireRole(role: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(unauthorized('Please log in'));
    // An impersonating admin (acting as member) keeps role MEMBER in the token,
    // so admin routes are correctly blocked while "viewing as member".
    if (req.user.role !== role) return next(forbidden('Insufficient permissions'));
    next();
  };
}
