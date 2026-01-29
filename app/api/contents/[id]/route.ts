import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ContentModel } from '@/lib/models';
import { isValidObjectId } from '@/lib/validation';
import { ERROR_CODES } from '@/lib/apiResponse';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid content ID format',
            code: ERROR_CODES.INVALID_INPUT,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    await connectDB();

    const content = await ContentModel.findById(id).lean();

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Content not found',
            code: ERROR_CODES.NOT_FOUND,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: content,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/contents/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch content. Please try again.',
          code: ERROR_CODES.INTERNAL_ERROR,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
