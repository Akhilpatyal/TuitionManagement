import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { student: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = bcrypt.compareSync(password, user.password);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Sign JWT
    const token = signToken({
      userId: user.id,
      role: user.role as any,
      email: user.email
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        studentId: user.student?.id || null
      }
    });

    setSessionCookie(response, token);
    return response;

  } catch (e: any) {
    console.error('Login error:', e);
    return NextResponse.json({ error: 'Server authentication crash' }, { status: 500 });
  }
}
