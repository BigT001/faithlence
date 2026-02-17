import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithGemini, analyzeImageWithGemini } from '@/lib/gemini';
import { transcribeMediaWithGemini } from '@/lib/audioExtractor';
import { connectDB } from '@/lib/mongodb';
import { ContentModel } from '@/lib/models';
import { ERROR_CODES } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';

// Maximum file size: 20MB (Vercel serverless limit is ~4.5MB request body,
// but we set a reasonable app-level limit here)
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Supported formats (video, audio, and images)
const SUPPORTED_FORMATS = [
  // Video
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/mpeg',
  'video/3gpp',
  // Audio
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
  'audio/x-aac',
  'audio/ogg',
  'audio/webm',
  'audio/flac',
  'audio/x-m4a',
  'audio/m4a',
  'audio/mp4',
  'audio/amr',
  'audio/3gpp',
  'audio/3gpp2',
  'audio/x-aiff',
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

/**
 * Determine a valid MIME type from the file's type or extension
 */
function resolveMimeType(file: File): string {
  if (file.type && file.type !== 'application/octet-stream') {
    return file.type;
  }

  // Fallback: guess from extension
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
    webm: 'audio/webm',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    '3gp': 'video/3gpp',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
  };

  return mimeMap[ext] || 'application/octet-stream';
}

export async function POST(request: NextRequest) {
  try {
    logger.info('API:Upload', 'File upload request received');

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = (formData.get('title') as string) || 'Uploaded File';

    // Validate file exists
    if (!file) {
      logger.warn('API:Upload', 'No file provided in request');
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'No file provided',
            code: ERROR_CODES.VALIDATION_ERROR,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const mimeType = resolveMimeType(file);

    logger.debug('API:Upload', 'File received', {
      name: file.name,
      size: file.size,
      type: file.type,
      resolvedMime: mimeType,
    });

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      logger.warn('API:Upload', 'File size exceeds limit', { size: file.size, limit: MAX_FILE_SIZE });
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit. Please use a smaller file.`,
            code: ERROR_CODES.INVALID_INPUT,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 413 }
      );
    }

    // Validate file type
    const isSupported = !file.type || SUPPORTED_FORMATS.includes(mimeType);
    if (!isSupported) {
      logger.warn('API:Upload', 'Unsupported file type', { type: mimeType });
    }

    // Read file into buffer (no disk write needed — we send directly to Gemini)
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');

    logger.debug('API:Upload', 'File read into memory', { sizeBytes: buffer.length });

    // Process file based on type — NO ffmpeg needed!
    let transcription: string;
    try {
      if (mimeType.startsWith('image/')) {
        // Image → Gemini Vision
        logger.info('API:Upload', 'Processing image with Gemini Vision...');
        transcription = await analyzeImageWithGemini(base64Data, mimeType);
        logger.success('API:Upload', 'Image analysis complete', {
          transcriptionLength: transcription.length,
        });
      } else {
        // Audio/Video → Send raw to Gemini for transcription (no ffmpeg conversion)
        logger.info('API:Upload', 'Transcribing media directly with Gemini (no ffmpeg)...');
        transcription = await transcribeMediaWithGemini(base64Data, mimeType);
        logger.success('API:Upload', 'Transcription complete', {
          transcriptionLength: transcription.length,
          words: transcription.split(/\s+/).length,
        });
      }
    } catch (error) {
      logger.error('API:Upload', 'Processing failed', error);
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

    // Analyze with Gemini
    let analysisResult;
    try {
      logger.info('API:Upload', 'Analyzing transcription with Gemini...');
      analysisResult = await analyzeWithGemini(transcription);

      // Add transcription to the result
      analysisResult.transcription = transcription;

      logger.success('API:Upload', 'Gemini analysis complete', {
        summaryLength: analysisResult.summary?.length || 0,
        hashtagsCount: analysisResult.hashtags?.length || 0,
      });
    } catch (error) {
      logger.error('API:Upload', 'Gemini analysis failed', error);

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

    let contentId = null;
    // Connect to MongoDB and save
    try {
      logger.info('API:Upload', 'Attempting MongoDB connection...');
      const conn = await connectDB();

      if (conn) {
        const content = new ContentModel({
          sourceType: 'upload',
          videoTitle: title,
          fileName: file.name,
          ...analysisResult,
        });

        const savedContent = await content.save();
        contentId = savedContent._id.toString();
        logger.success('API:Upload', 'Content saved to MongoDB', { contentId });
      } else {
        logger.warn('API:Upload', 'MongoDB not connected (graceful degradation)');
      }
    } catch (error) {
      logger.error('API:Upload', 'MongoDB save failed', error);
      // We don't fail the whole request if DB save fails, but we log it
    }

    logger.success('API:Upload', 'Request completed successfully');
    return NextResponse.json(
      {
        success: true,
        data: {
          id: contentId,
          fileName: file.name,
          analysis: analysisResult,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown upload error');
    logger.error('API:Upload', 'Unhandled catch-all error', { msg: errorMessage });
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
