import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  let token: string | undefined;
  
  try {
    const cookieStore = await cookies();
    token = cookieStore.get('auth-token')?.value;
  } catch {
    // cookies() may fail in certain contexts
  }

  // Also try reading from headers (set by middleware from localStorage token)
  if (!token) {
    try {
      const { headers } = await import('next/headers');
      const headerStore = await headers();
      const authHeader = headerStore.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      }
    } catch {
      // headers() may fail
    }
  }

  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload) return null;
  
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, fullName: true, username: true, role: true, isActive: true },
  });
  
  if (!user || !user.isActive) return null;
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
