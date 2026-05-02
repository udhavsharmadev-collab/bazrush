import { connectDB } from '../../lib/mongodb.js';
import Product from '../../models/Product.js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find({}).lean();
    return NextResponse.json({ products });
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