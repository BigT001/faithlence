import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ContentModel } from '@/lib/models';
import { ERROR_CODES } from '@/lib/apiResponse';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get query parameters for pagination
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '10')); // Cap at 100

    const skip = (page - 1) * limit;

    // Fetch content with pagination
    const contents = await ContentModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ContentModel.countDocuments();

    return NextResponse.json(
      {
        success: true,
        data: contents,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/contents:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch contents. Please try again.',
          code: ERROR_CODES.DATABASE_ERROR,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
