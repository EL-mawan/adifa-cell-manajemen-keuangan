import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireRole } from '@/lib/auth-api';
import { db } from '@/lib/db';

// GET /api/categories - List categories
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);

  if (auth.error) {
    return auth.error;
  }

  try {
    const categories = await db.category.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data kategori' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create category
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);

  if (auth.error) {
    return auth.error;
  }

  const hasAccess = requireRole(['ADMIN'])(auth.user);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Anda tidak memiliki akses' },
      { status: 403 }
    );
  }

  try {
    const { name, icon } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Nama kategori harus diisi' },
        { status: 400 }
      );
    }

    const category = await db.category.create({
      data: {
        name,
        icon: icon || 'Package',
        isActive: true,
      },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId: auth.user.userId,
        action: 'CREATE_CATEGORY',
        module: 'PRODUCT',
        details: `Kategori baru: ${name}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Create category error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Kategori dengan nama tersebut sudah ada' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membuat kategori' },
      { status: 500 }
    );
  }
}
