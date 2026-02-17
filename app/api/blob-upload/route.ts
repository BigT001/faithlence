import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Vercel Blob Client Upload Handler
 * 
 * This route handles the token generation and upload completion callbacks
 * for client-side uploads to Vercel Blob storage.
 * 
 * The client uploads directly to Blob (no 4.5MB serverless limit).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname) => {
                // Validate the upload before generating a token
                logger.info('BlobUpload', 'Generating upload token', { pathname });

                return {
                    // Allow uploads up to 100MB
                    maximumSizeInBytes: 100 * 1024 * 1024,
                    // Allowed content types
                    allowedContentTypes: [
                        // Audio
                        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
                        'audio/aac', 'audio/x-aac', 'audio/ogg', 'audio/webm',
                        'audio/flac', 'audio/x-m4a', 'audio/m4a', 'audio/mp4',
                        'audio/amr', 'audio/3gpp', 'audio/3gpp2', 'audio/x-aiff',
                        // Video
                        'video/mp4', 'video/webm', 'video/quicktime',
                        'video/x-msvideo', 'video/x-matroska', 'video/mpeg', 'video/3gpp',
                        // Images
                        'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
                    ],
                };
            },
            onUploadCompleted: async ({ blob }) => {
                // Called after the file is uploaded to Blob storage
                logger.success('BlobUpload', 'File uploaded to Blob', {
                    url: blob.url,
                    pathname: blob.pathname,
                });
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        logger.error('BlobUpload', 'Upload handler failed', error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }
        );
    }
}
