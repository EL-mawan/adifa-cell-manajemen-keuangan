import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './jwt';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export async function verifyAuth(request: NextRequest): Promise<{ user: AuthUser; error: null } | { user: null; error: NextResponse }> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Unauthorized - Token tidak ditemukan' },
          { status: 401 }
        ),
      };
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Unauthorized - Token tidak valid' },
          { status: 401 }
        ),
      };
    }

    return {
      user: payload as AuthUser,
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Terjadi kesalahan autentikasi' },
        { status: 500 }
      ),
    };
  }
}

export function requireRole(allowedRoles: string[]) {
  return (user: AuthUser): boolean => {
    return allowedRoles.includes(user.role);
  };
}
