import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ContentModel } from '@/lib/models';
import { logger } from '@/lib/logger';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        logger.info('API:Content', 'Fetching content by ID', { id });

        // Connect to database
        await connectDB();

        // Fetch content by ID
        const content = await ContentModel.findById(id).lean();

        if (!content) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        message: 'Content not found',
                    },
                    timestamp: new Date().toISOString(),
                },
                { status: 404 }
            );
        }

        logger.success('API:Content', 'Content fetched successfully', { id });

        return NextResponse.json({
            success: true,
            data: content,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error('API:Content', 'Failed to fetch content', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    message: 'Failed to fetch content',
                },
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
