import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithGemini } from '@/lib/gemini';
import { connectDB } from '@/lib/mongodb';
import { ContentModel } from '@/lib/models';
import { validateTranscription } from '@/lib/validation';
import { ERROR_CODES } from '@/lib/apiResponse';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcription } = body;

    // Validate input
    if (!transcription) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Transcription text is required',
            code: ERROR_CODES.VALIDATION_ERROR,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const validation = validateTranscription(transcription);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: validation.error || 'Invalid transcription',
            code: ERROR_CODES.INVALID_INPUT,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Analyze with Gemini
    let analysisResult;
    try {
      analysisResult = await analyzeWithGemini(transcription);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Failed to analyze content. Please try again.',
            code: ERROR_CODES.EXTERNAL_SERVICE_ERROR,
            details: { originalError: error instanceof Error ? error.message : 'Unknown error' },
          },
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    // Connect to MongoDB and save
    try {
      await connectDB();

      const content = new ContentModel({
        sourceType: 'upload',
        ...analysisResult,
      });

      await content.save();

      return NextResponse.json(
        {
          success: true,
          data: {
            contentId: content._id,
            analysis: analysisResult,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Failed to save content. Please try again.',
            code: ERROR_CODES.DATABASE_ERROR,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in /api/analyze:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'An unexpected error occurred. Please try again.',
          code: ERROR_CODES.INTERNAL_ERROR,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
