import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { analyzeWithGemini, analyzeImageWithGemini } from '@/lib/gemini';
import { transcribeMediaWithGemini } from '@/lib/audioExtractor';
import { connectDB } from '@/lib/mongodb';
import { ContentModel } from '@/lib/models';
import { ERROR_CODES } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';

/**
 * Process a file that was uploaded to Vercel Blob.
 * 
 * Flow:
 * 1. Receive blob URL + metadata from client
 * 2. Fetch file content from Blob
 * 3. Send to Gemini for transcription/analysis
 * 4. Delete the blob (cleanup)
 * 5. Return results
 */
export async function POST(request: NextRequest) {
    let blobUrl: string | null = null;

    try {
        const body = await request.json();
        blobUrl = body.blobUrl;
        const fileName = body.fileName || 'Uploaded File';
        const mimeType = body.mimeType || 'application/octet-stream';
        const title = body.title || fileName;

        if (!blobUrl) {
            return NextResponse.json(
                {
                    success: false,
                    error: { message: 'No blob URL provided', code: ERROR_CODES.VALIDATION_ERROR },
                    timestamp: new Date().toISOString(),
                },
                { status: 400 }
            );
        }

        logger.info('API:Process', 'Processing blob file', { blobUrl, fileName, mimeType });

        // Step 1: Fetch the file from Vercel Blob
        const blobResponse = await fetch(blobUrl);
        if (!blobResponse.ok) {
            throw new Error(`Failed to fetch blob: ${blobResponse.status} ${blobResponse.statusText}`);
        }

        const arrayBuffer = await blobResponse.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        logger.info('API:Process', 'File fetched from Blob', {
            sizeBytes: arrayBuffer.byteLength,
            sizeMB: (arrayBuffer.byteLength / 1024 / 1024).toFixed(2),
        });

        // Step 2: Process based on file type
        let transcription: string;
        try {
            if (mimeType.startsWith('image/')) {
                logger.info('API:Process', 'Processing image with Gemini Vision...');
                transcription = await analyzeImageWithGemini(base64Data, mimeType);
                logger.success('API:Process', 'Image analysis complete', {
                    transcriptionLength: transcription.length,
                });
            } else {
                logger.info('API:Process', 'Transcribing media with Gemini...');
                transcription = await transcribeMediaWithGemini(base64Data, mimeType);
                logger.success('API:Process', 'Transcription complete', {
                    transcriptionLength: transcription.length,
                    words: transcription.split(/\s+/).length,
                });
            }
        } catch (error) {
            logger.error('API:Process', 'Media processing failed', error);
            // Clean up blob even on error
            await cleanupBlob(blobUrl);
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        message: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        code: ERROR_CODES.EXTERNAL_SERVICE_ERROR,
                        details: { originalError: error instanceof Error ? error.message : 'Unknown error' },
                    },
                    timestamp: new Date().toISOString(),
                },
                { status: 422 }
            );
        }

        // Step 3: Analyze with Gemini
        let analysisResult;
        try {
            logger.info('API:Process', 'Analyzing transcription with Gemini...');
            analysisResult = await analyzeWithGemini(transcription);
            analysisResult.transcription = transcription;

            logger.success('API:Process', 'Gemini analysis complete', {
                summaryLength: analysisResult.summary?.length || 0,
                hashtagsCount: analysisResult.hashtags?.length || 0,
            });
        } catch (error) {
            logger.error('API:Process', 'Gemini analysis failed', error);
            await cleanupBlob(blobUrl);

            const reason = error instanceof Error ? error.message : 'Unknown AI error';
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        message: `AI analysis failed: ${reason}`,
                        code: ERROR_CODES.EXTERNAL_SERVICE_ERROR,
                        details: { reason },
                    },
                    timestamp: new Date().toISOString(),
                },
                { status: 503 }
            );
        }

        // Step 4: Save to MongoDB
        let contentId = null;
        try {
            logger.info('API:Process', 'Attempting MongoDB connection...');
            const conn = await connectDB();

            if (conn) {
                const content = new ContentModel({
                    sourceType: 'upload',
                    videoTitle: title,
                    fileName: fileName,
                    ...analysisResult,
                });

                const savedContent = await content.save();
                contentId = savedContent._id.toString();
                logger.success('API:Process', 'Content saved to MongoDB', { contentId });
            } else {
                logger.warn('API:Process', 'MongoDB not connected (graceful degradation)');
            }
        } catch (error) {
            logger.error('API:Process', 'MongoDB save failed', error);
        }

        // Step 5: Clean up the blob
        await cleanupBlob(blobUrl);

        logger.success('API:Process', 'Request completed successfully');
        return NextResponse.json(
            {
                success: true,
                data: {
                    id: contentId,
                    fileName: fileName,
                    analysis: analysisResult,
                },
                timestamp: new Date().toISOString(),
            },
            { status: 201 }
        );
    } catch (error) {
        // Clean up blob on unhandled error
        if (blobUrl) await cleanupBlob(blobUrl);

        const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
        logger.error('API:Process', 'Unhandled error', { msg: errorMessage });
        return NextResponse.json(
            {
                success: false,
                error: {
                    message: errorMessage,
                    code: ERROR_CODES.INTERNAL_ERROR,
                },
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

/**
 * Delete a blob from Vercel Blob storage (best-effort cleanup)
 */
async function cleanupBlob(url: string) {
    try {
        await del(url);
        logger.info('API:Process', 'Blob deleted', { url });
    } catch (error) {
        logger.warn('API:Process', 'Failed to delete blob (non-critical)', {
            url,
            error: error instanceof Error ? error.message : 'Unknown',
        });
    }
}
