import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireRole } from '@/lib/auth-api';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const { name, icon, isActive } = await request.json();

    const category = await db.category.update({
      where: { id: params.id },
      data: {
        name,
        icon,
        isActive,
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
  { params }: { params: { id: string } }
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
    await db.category.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Kategori berhasil dihapus' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menghapus kategori' },
      { status: 500 }
    );
  }
}
