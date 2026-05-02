import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const imagesDir = path.join(process.cwd(), 'public/images');

export async function GET(request, { params }) {
  const id = params.id;
  const imagePath = path.join(imagesDir, id);
  
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const ext = id.split('.').pop()?.toLowerCase() || 'jpg';
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
    
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
}
