import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ContentModel } from '@/lib/models';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
    try {
        logger.info('API:History', 'Fetching chat history');

        // Connect to database
        await connectDB();

        // Fetch all content, sorted by most recent first
        const contents = await ContentModel.find({})
            .sort({ createdAt: -1 })
            .limit(50)
            .select('_id videoTitle summary createdAt sourceType')
            .lean();

        logger.success('API:History', 'History fetched', { count: contents.length });

        return NextResponse.json({
            success: true,
            data: contents.map(item => ({
                id: item._id.toString(),
                title: item.videoTitle || 'Untitled Analysis',
                summary: item.summary?.substring(0, 100) || '',
                timestamp: item.createdAt,
                type: item.sourceType,
            })),
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error('API:History', 'Failed to fetch history', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    message: 'Failed to fetch history',
                },
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
