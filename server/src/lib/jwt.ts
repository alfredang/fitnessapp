import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { env } from './env.js';
import type { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string; // user id
  role: Role;
  // When an admin is "viewing as member", we keep their real id here so they can switch back.
  impersonatorId?: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    maxAge: SEVEN_DAYS,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(env.cookieName);
}
