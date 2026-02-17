import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireRole } from '@/lib/auth-api';
import { db } from '@/lib/db';

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
    const { name, code, contact, address, isActive } = body;

    const existingSupplier = await db.supplier.findUnique({ where: { id } });
    if (!existingSupplier) {
        return NextResponse.json({ error: 'Supplier tidak ditemukan' }, { status: 404 });
    }

    if (code && code !== existingSupplier.code) {
        const codeExists = await db.supplier.findUnique({ where: { code } });
        if (codeExists) {
            return NextResponse.json({ error: 'Kode Supplier sudah digunakan' }, { status: 400 });
        }
    }

    const supplier = await db.supplier.update({
        where: { id },
        data: {
            name: name || undefined,
            code: code || undefined,
            contact: contact !== undefined ? contact : undefined,
            address: address !== undefined ? address : undefined,
            isActive: isActive !== undefined ? isActive : undefined,
        },
    });

    // Log Activity
    await db.activityLog.create({
      data: {
        userId: auth.user.userId,
        action: 'UPDATE_SUPPLIER',
        module: 'SUPPLIER_MANAGEMENT',
        details: `Update supplier: ${supplier.name} (${supplier.code})`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(supplier);

  } catch (error) {
    console.error('Update supplier error:', error);
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

    const existingSupplier = await db.supplier.findUnique({ 
        where: { id },
        include: { _count: { select: { products: true } } }
    });
    
    if (!existingSupplier) {
        return NextResponse.json({ error: 'Supplier tidak ditemukan' }, { status: 404 });
    }

    if (existingSupplier._count.products > 0) {
        return NextResponse.json({ error: 'Tidak dapat menghapus supplier yang memiliki produk aktif' }, { status: 400 });
    }

    await db.supplier.delete({ where: { id } });

    // Log Activity
    await db.activityLog.create({
      data: {
        userId: auth.user.userId,
        action: 'DELETE_SUPPLIER',
        module: 'SUPPLIER_MANAGEMENT',
        details: `Hapus supplier: ${existingSupplier.name} (${existingSupplier.code})`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({ message: 'Supplier berhasil dihapus' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
