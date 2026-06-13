import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role } from '@prisma/client';

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'institute';
}

// GET — list all institutes (platform owner only)
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['SUPER_ADMIN']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const institutes = await prisma.institute.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { students: true, users: true } }
      }
    });

    const formatted = institutes.map((i) => ({
      id: i.id,
      name: i.name,
      slug: i.slug,
      status: i.status,
      logoUrl: i.logoUrl,
      primaryColor: i.primaryColor,
      createdAt: i.createdAt,
      studentCount: i._count.students,
      userCount: i._count.users
    }));

    return NextResponse.json(formatted);
  } catch (e: any) {
    console.error('GET Institutes error:', e);
    return NextResponse.json({ error: 'Failed to list institutes' }, { status: 500 });
  }
}

// POST — create an institute and its first owner account
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, ['SUPER_ADMIN']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const body = await req.json();
    const { name, ownerName, ownerEmail, ownerPassword, primaryColor } = body;

    if (!name || !ownerName || !ownerEmail || !ownerPassword) {
      return NextResponse.json(
        { error: 'Institute name, owner name, owner email, and password are required' },
        { status: 400 }
      );
    }

    // Email must be globally unique across the platform
    const existing = await prisma.user.findUnique({ where: { email: ownerEmail.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'That owner email is already in use' }, { status: 409 });
    }

    // Ensure a unique slug
    const base = slugify(name);
    let slug = base;
    let n = 1;
    while (await prisma.institute.findUnique({ where: { slug } })) {
      slug = `${base}-${n++}`;
    }

    const hashedPassword = bcrypt.hashSync(ownerPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      const institute = await tx.institute.create({
        data: {
          name,
          slug,
          status: 'ACTIVE',
          primaryColor: primaryColor || null
        }
      });

      // First owner account — uses ADMIN role (acts as institute owner in current build)
      const owner = await tx.user.create({
        data: {
          email: ownerEmail.toLowerCase(),
          password: hashedPassword,
          name: ownerName,
          role: Role.ADMIN,
          instituteId: institute.id
        }
      });

      return { institute, owner };
    });

    return NextResponse.json({
      success: true,
      institute: { id: result.institute.id, name: result.institute.name, slug: result.institute.slug },
      owner: { email: result.owner.email }
    });
  } catch (e: any) {
    console.error('POST Institute error:', e);
    return NextResponse.json({ error: 'Failed to create institute' }, { status: 500 });
  }
}
