import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'apex_tuition_hyper_quantum_encryption_secret_key_2026';
const COOKIE_NAME = 'tms_session_token';

export type AppRole = 'SUPER_ADMIN' | 'INSTITUTE_OWNER' | 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface TokenPayload {
  userId: string;
  role: AppRole;
  email: string;
}

// Sign session token
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verify token
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (e) {
    return null;
  }
}

// Get user session from cookie / header
export async function getSessionUser(req: NextRequest) {
  let token = req.cookies.get(COOKIE_NAME)?.value;

  // Fallback to Auth Header
  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      instituteId: true,
      student: true
    }
  });
  return user;
}

// Enforce specific role
export async function requireAuth(req: NextRequest, allowedRoles?: AppRole[]) {
  const user = await getSessionUser(req);
  if (!user) {
    return { authenticated: false as const, response: NextResponse.json({ error: 'Session unauthorized' }, { status: 401 }) };
  }

  if (allowedRoles && !allowedRoles.includes(user.role as any)) {
    return { authenticated: false as const, response: NextResponse.json({ error: 'Permission denied' }, { status: 403 }) };
  }

  // Flatten studentId + instituteId for convenience in API routes
  const augmentedUser = {
    ...user,
    studentId: (user as any).student?.id || null,
    instituteId: (user as any).instituteId as string
  };

  return { authenticated: true as const, user: augmentedUser };
}

// Helper to set cookie headers on response
export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

// Clear cookie
export function clearSessionCookie(response: NextResponse) {
  response.cookies.delete(COOKIE_NAME);
}
