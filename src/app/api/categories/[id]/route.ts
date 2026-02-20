import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireRole } from '@/lib/auth-api';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const { name, icon, isActive, type } = await request.json();

    // Validate type if provided
    if (type && !['INCOME', 'EXPENSE'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipe kategori harus INCOME atau EXPENSE' },
        { status: 400 }
      );
    }

    const category = await db.category.update({
      where: { id },
      data: {
        name,
        icon,
        isActive,
        type,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memperbarui kategori' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    await db.category.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Kategori berhasil dihapus' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menghapus kategori' },
      { status: 500 }
    );
  }
}

