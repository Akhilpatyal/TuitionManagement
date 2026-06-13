import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, signToken, setSessionCookie } from '@/lib/auth';

// POST — a super admin stops impersonating and returns to the platform identity
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.authenticated) {
      return authResult.response;
    }
    if ((authResult.user as any).realRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Re-issue a plain super-admin token (no actingInstituteId)
    const token = signToken({
      userId: authResult.user.id,
      role: 'SUPER_ADMIN',
      email: authResult.user.email
    });

    const response = NextResponse.json({ success: true });
    setSessionCookie(response, token);
    return response;
  } catch (e: any) {
    console.error('Stop impersonate error:', e);
    return NextResponse.json({ error: 'Failed to exit institute' }, { status: 500 });
  }
}
