import { NextRequest, NextResponse } from 'next/server';
import { chatWithGemini } from '@/lib/gemini';
import { connectDB } from '@/lib/mongodb';
import { ContentModel } from '@/lib/models';
import { ERROR_CODES } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { contentId, message, history } = body;

        if (!contentId || !message) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        message: 'Content ID and message are required',
                        code: ERROR_CODES.VALIDATION_ERROR,
                    },
                    timestamp: new Date().toISOString(),
                },
                { status: 400 }
            );
        }

        // Connect to DB and fetch the content transcription
        await connectDB();
        const content = await ContentModel.findById(contentId);

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

        const transcription = content.transcription || '';

        // Call Gemini for chat response
        const response = await chatWithGemini(transcription, message, history || []);

        return NextResponse.json(
            {
                success: true,
                data: {
                    response,
                },
                timestamp: new Date().toISOString(),
            },
            { status: 200 }
        );
    } catch (error) {
        logger.error('API:Chat', 'Unhandled error in chat endpoint', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    message: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
                    code: ERROR_CODES.INTERNAL_ERROR,
                },
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
