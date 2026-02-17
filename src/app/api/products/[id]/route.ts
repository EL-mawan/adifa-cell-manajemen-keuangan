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
    return NextResponse.json(
      { error: 'Anda tidak memiliki akses' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { code, name, category, supplierId, basePrice, sellingPrice, fee, minBalance, isActive } = body;

    // Calculate profit if prices change
    let profit: number | undefined = undefined;
    if (basePrice !== undefined && sellingPrice !== undefined) {
      profit = parseFloat(sellingPrice) - parseFloat(basePrice);
    } else if (basePrice !== undefined) {
      // Fetch existing sellingPrice? Or assume provided in body?
      // Better to recalculate profit only if both provided to avoid stale data
    }
    
    // For simplicity, assume all fields sent or handle partial updates carefully.
    // Let's recalculate profit based on new values or existing ones if provided.
    
    // Check existing product for partial update
    const existingProduct = await db.product.findUnique({ where: { id } });
    if (!existingProduct) {
       return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    const newBasePrice = basePrice !== undefined ? parseFloat(basePrice) : existingProduct.basePrice;
    const newSellingPrice = sellingPrice !== undefined ? parseFloat(sellingPrice) : existingProduct.sellingPrice;
    const newFee = fee !== undefined ? parseFloat(fee) : existingProduct.fee;
    const newProfit = (newSellingPrice + newFee) - newBasePrice;

    const product = await db.product.update({
      where: { id },
      data: {
        code: code || undefined,
        name: name || undefined,
        category: category || undefined,
        supplierId: supplierId || undefined,
        basePrice: basePrice !== undefined ? parseFloat(basePrice) : undefined,
        sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : undefined,
        fee: fee !== undefined ? parseFloat(fee) : undefined,
        profit: newProfit,
        minBalance: minBalance !== undefined ? parseFloat(minBalance) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
      include: {
        supplier: true,
      },
    });

    // Log Activity
    await db.activityLog.create({
      data: {
        userId: auth.user.userId,
        action: 'UPDATE_PRODUCT',
        module: 'PRODUCT',
        details: `Update produk: ${product.name} (${product.code})`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengupdate produk' },
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Check if product exists
    const existingProduct = await db.product.findUnique({ where: { id } });
    if (!existingProduct) {
        return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    // Delete product
    await db.product.delete({
      where: { id },
    });

    // Log Activity
    await db.activityLog.create({
      data: {
        userId: auth.user.userId,
        action: 'DELETE_PRODUCT',
        module: 'PRODUCT',
        details: `Hapus produk: ${existingProduct.name} (${existingProduct.code})`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menghapus produk' },
      { status: 500 }
    );
  }
}
