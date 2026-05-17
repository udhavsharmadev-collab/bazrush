export async function GET(request, { params }) {
  // Cloudinary serves images directly via URL now
  return new Response('Image serving moved to Cloudinary', { status: 410 });
}