import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { NextResponse } from 'next/server';

const imagesDir = path.join(process.cwd(), 'public/images');

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    // Ensure images directory exists
    await fs.mkdir(imagesDir, { recursive: true });

    const imageFile = formData.get('image');
    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Generate short ID from file buffer (first 2 chars of MD5 hash)
    const generateShortId = async (file) => {
      const bytes = await file.arrayBuffer();
      const hash = crypto.createHash('md5').update(Buffer.from(bytes)).digest('hex');
      const ext = path.extname(file.name).toLowerCase() || '.jpg';
      return `${hash.slice(0, 2)}${ext}`;
    };

    const imageId = await generateShortId(imageFile);
    
    // Save image
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const filePath = path.join(imagesDir, imageId);
    await fs.writeFile(filePath, buffer);

    return new Response(imageId, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (error) {
    console.error('Product image upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}

