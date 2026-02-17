import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireRole } from '@/lib/auth-api';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);

  if (auth.error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hasAccess = requireRole(['ADMIN'])(auth.user);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const suppliers = await db.supplier.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error('Fetch suppliers error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);

  if (auth.error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hasAccess = requireRole(['ADMIN'])(auth.user);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, code, contact, address, isActive } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and Code are required' }, { status: 400 });
    }

    const existingSupplier = await db.supplier.findUnique({ where: { code } });
    if (existingSupplier) {
      return NextResponse.json({ error: 'Kode Supplier sudah digunakan' }, { status: 400 });
    }

    const supplier = await db.supplier.create({
      data: {
        name,
        code,
        contact,
        address,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    // Log Activity
    await db.activityLog.create({
      data: {
        userId: auth.user.userId,
        action: 'CREATE_SUPPLIER',
        module: 'SUPPLIER_MANAGEMENT',
        details: `Tambah supplier Baru: ${supplier.name} (${supplier.code})`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Create supplier error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
