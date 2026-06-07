import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { requireAuth } from '@/lib/auth';

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

    // Create uploads folder inside public
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Write file to disk
    // Replace any unsafe characters in filename
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
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
    return NextResponse.json({ error: 'Failed to write upload stream to disk' }, { status: 500 });
  }
}
