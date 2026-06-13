import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, signToken, setSessionCookie } from '@/lib/auth';

// POST — a super admin starts acting as an institute's admin
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.authenticated) {
      return authResult.response;
    }
    // Only the real platform owner may impersonate
    if ((authResult.user as any).realRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { instituteId } = await req.json();
    if (!instituteId) {
      return NextResponse.json({ error: 'instituteId is required' }, { status: 400 });
    }

    const institute = await prisma.institute.findUnique({ where: { id: instituteId } });
    if (!institute) {
      return NextResponse.json({ error: 'Institute not found' }, { status: 404 });
    }

    const token = signToken({
      userId: authResult.user.id,
      role: 'SUPER_ADMIN',
      email: authResult.user.email,
      actingInstituteId: instituteId
    });

    const response = NextResponse.json({ success: true, institute: { id: institute.id, name: institute.name } });
    setSessionCookie(response, token);
    return response;
  } catch (e: any) {
    console.error('Impersonate error:', e);
    return NextResponse.json({ error: 'Failed to open institute' }, { status: 500 });
  }
}
