import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// API endpoint ini untuk handle image sharing pake kedaluwarsa/expiration
// In-memory storage for shared images (in production, use a database)
const sharedImages = new Map();

export async function POST(request) {
  try {
    const { imageData, expiresIn = 86400 } = await request.json(); // Default-nya 24 jam

    if (!imageData) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Generate unique ID for the shared image
    const id = uuidv4();

    // Calculate expiration time
    const expiresAt = Date.now() + expiresIn * 1000;

    // Store the image data with expiration
    sharedImages.set(id, {
      imageData,
      expiresAt,
    });

    // Schedule cleanup after expiration
    setTimeout(() => {
      sharedImages.delete(id);
    }, expiresIn * 1000);

    // Generate shareable URL
    const shareableUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    }/shared/${id}`;

    return NextResponse.json({ url: shareableUrl });
  } catch (error) {
    console.error('Gagal membagikan image:', error);
    return NextResponse.json(
      { error: 'Gagal memproses image' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id || !sharedImages.has(id)) {
      return NextResponse.json(
        { error: 'Gambar yang dibagikan sudah kedaluwarsa/tidak ditemukan' },
        { status: 404 }
      );
    }

    const { imageData, expiresAt } = sharedImages.get(id);

    // Check udah expired belum
    if (Date.now() > expiresAt) {
      sharedImages.delete(id);
      return NextResponse.json(
        { error: 'Gambar yang dibagikan sudah kedaluwarsa' },
        { status: 410 }
      );
    }

    return NextResponse.json({ imageData });
  } catch (error) {
    console.error('Gagal menerima image yang dibagikan:', error);
    return NextResponse.json(
      { error: 'Gagal menerima image' },
      { status: 500 }
    );
  }
}
