import { NextRequest, NextResponse } from 'next/server';

import { getProfessionalSession } from '@/lib/get-professional-session';
import { uploadProfileImage } from '@/lib/cloudinary';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/professional/profile/upload-photo
 * Accepts a base64 image, uploads to Cloudinary, and updates the professional's photoUrl.
 * Max file size: ~5MB (base64 encoded)
 */
export async function POST(request: NextRequest) {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  try {
    const body = await request.json();
    const { image } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: 'image (base64) is required' },
        { status: 422 },
      );
    }

    // Validate it looks like a base64 data URI
    if (!image.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: 'Invalid image format. Must be a base64 data URI.' },
        { status: 422 },
      );
    }

    // Upload to Cloudinary
    const photoUrl = await uploadProfileImage(image, professionalId);

    // Update professional record
    await prisma.professional.update({
      where: { id: professionalId },
      data: { photoUrl },
    });

    return NextResponse.json({ photoUrl });
  } catch (err) {
    console.error('Photo upload error:', err);
    return NextResponse.json({ error: 'UPLOAD_FAILED' }, { status: 500 });
  }
}
