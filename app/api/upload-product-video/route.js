import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const formData  = await request.formData();
    const videoFile = formData.get('video');

    if (!videoFile) {
      return NextResponse.json({ error: 'No video provided' }, { status: 400 });
    }

    const bytes  = await videoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'product-videos', resource_type: 'video' },
        (error, result) => error ? reject(error) : resolve(result)
      ).end(buffer);
    });

    return new Response(result.secure_url, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });

  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json({ error: 'Upload failed', details: error.message }, { status: 500 });
  }
}