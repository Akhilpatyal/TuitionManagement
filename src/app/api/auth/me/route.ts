import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const actingInstituteId = (user as any).actingInstituteId || null;
  const isImpersonating = user.role === 'SUPER_ADMIN' && !!actingInstituteId;

  // While impersonating, report the EFFECTIVE role (ADMIN) so the admin portal works
  const effectiveRole = isImpersonating ? 'ADMIN' : user.role;

  let actingInstitute = null;
  if (isImpersonating) {
    const inst = await prisma.institute.findUnique({ where: { id: actingInstituteId } });
    if (inst) actingInstitute = { id: inst.id, name: inst.name };
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: effectiveRole,
      realRole: user.role,
      name: isImpersonating && actingInstitute ? actingInstitute.name : user.name,
      studentId: user.student?.id || null,
      student: user.student || null
    },
    isImpersonating,
    actingInstitute
  });
}
