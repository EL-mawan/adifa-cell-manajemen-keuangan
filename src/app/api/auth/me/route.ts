import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-api';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);

  if (auth.error) {
    return auth.error;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: auth.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        balance: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data user' },
      { status: 500 }
    );
  }
}
