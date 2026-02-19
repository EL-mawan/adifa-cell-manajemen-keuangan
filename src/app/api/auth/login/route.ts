// Redeploy trigger: 2026-02-18 04:35
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  console.log('Login attempt started...');
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log(`Login attempt for email: ${email}`);

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Akun Anda telah dinonaktifkan' },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Log activity (wrapped in try-catch to prevent login failure if DB is read-only)
    try {
      await db.activityLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          module: 'AUTH',
          details: 'User berhasil login',
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });
    } catch (logError) {
      console.error('Failed to log login activity:', logError);
      // We continue since the user has already authenticated successfully
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
      },
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: `Terjadi kesalahan saat login: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
