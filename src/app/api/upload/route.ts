import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { requireAuth } from '@/lib/auth';
import { isR2Configured, uploadToR2 } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await requireAuth(req, ['ADMIN']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file reference uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Replace any unsafe characters in filename
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const instituteId = authResult.user.instituteId || 'shared';

    // Preferred: Cloudflare R2 (works on Vercel's read-only filesystem)
    if (isR2Configured()) {
      const key = `uploads/${instituteId}/${randomUUID()}-${safeName}`;
      const url = await uploadToR2(key, buffer, file.type || 'application/octet-stream');
      return NextResponse.json({ success: true, url, name: safeName, size: file.size });
    }

    // Dev fallback: write to public/uploads (does NOT work on Vercel)
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    const filePath = join(uploadsDir, safeName);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${safeName}`,
      name: safeName,
      size: file.size
    });

  } catch (e: any) {
    console.error('File upload error:', e);
    return NextResponse.json({ error: 'Failed to store uploaded file' }, { status: 500 });
  }
}
