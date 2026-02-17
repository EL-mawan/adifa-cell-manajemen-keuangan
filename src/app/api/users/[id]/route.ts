import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireRole } from '@/lib/auth-api';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request);

  if (auth.error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hasAccess = requireRole(['ADMIN'])(auth.user);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, role, balance, isActive, password } = body;

    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
        return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const updateData: any = {
        name: name || undefined,
        email: email || undefined,
        role: role || undefined,
        balance: balance !== undefined ? parseFloat(balance) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
    };

    if (password) {
        updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await db.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true, name: true, email: true, role: true, balance: true, isActive: true
        }
    });

     // Log Activity
    await db.activityLog.create({
      data: {
        userId: auth.user.userId,
        action: 'UPDATE_USER',
        module: 'USER_MANAGEMENT',
        details: `Update user: ${user.name} (${user.email})`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(user);

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request);

  if (auth.error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hasAccess = requireRole(['ADMIN'])(auth.user);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;

    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
        return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Prevent deleting self
    if (existingUser.id === auth.user.userId) {
        return NextResponse.json({ error: 'Tidak dapat menghapus akun sendiri' }, { status: 400 });
    }

    await db.user.delete({ where: { id } });

    // Log Activity
    await db.activityLog.create({
      data: {
        userId: auth.user.userId,
        action: 'DELETE_USER',
        module: 'USER_MANAGEMENT',
        details: `Hapus user: ${existingUser.name} (${existingUser.email})`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
