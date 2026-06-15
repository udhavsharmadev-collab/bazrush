import { connectDB } from '../../lib/mongodb.js';
import Product from '../../models/Product.js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await connectDB();
    const sellerPhone = request.nextUrl.searchParams.get('sellerPhone');

    const query = sellerPhone ? { sellerPhone } : {};
    const products = await Product.find(query).lean();

    const mapped = products.map((p) => ({
      ...p,
      image: p.mainImageId || (p.imageIds && p.imageIds[0]) || '',
    }));

    return NextResponse.json({ products: mapped });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read products' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const newProduct = await Product.create({
      id: Date.now().toString(),
      shopId: body.shopId,
      sellerPhone: body.sellerPhone,
      name: body.name,
      category: body.category,
      sizes: body.sizes || [],
      colors: body.colors || [],
      colorImageIds: body.colorImageIds || [],   // ← added
      price: parseFloat(body.price),
      stockQuantity: body.stockQuantity || 0,
      stockStatus: body.stockStatus || 'out_of_stock',
      mainImageId: body.mainImageId,
      imageIds: body.imageIds || [],
    });
    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const body = await request.json();
    const productId = request.nextUrl.searchParams.get('id');

    if (!productId) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const product = await Product.findOne({ id: productId });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    Object.assign(product, {
      ...body,
      colorImageIds: body.colorImageIds || product.colorImageIds || [],  // ← added
      stockQuantity: body.stockQuantity !== undefined ? parseInt(body.stockQuantity) || 0 : product.stockQuantity,
      stockStatus: body.stockStatus || product.stockStatus || 'out_of_stock',
    });

    await product.save();
    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const productId = request.nextUrl.searchParams.get('id');

    if (!productId) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const deleted = await Product.findOneAndDelete({ id: productId });
    if (!deleted) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}