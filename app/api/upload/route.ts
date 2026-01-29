import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { extractAudioFromFile, transcribeAudioWithGemini, cleanupAudioFile } from '@/lib/audioExtractor';
import { analyzeWithGemini } from '@/lib/gemini';
import { connectDB } from '@/lib/mongodb';
import { ContentModel } from '@/lib/models';
import { ERROR_CODES } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';

// Maximum file size: 500MB
const MAX_FILE_SIZE = 500 * 1024 * 1024;

// Supported formats (video and audio)
const SUPPORTED_FORMATS = [
  // Video
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/mpeg',
  // Audio
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
  'audio/ogg',
  'audio/webm',
  'audio/flac',
  'audio/x-m4a',
  'audio/mp4',
  'audio/amr',
  'audio/x-aiff',
];

export async function POST(request: NextRequest) {
  let videoFilePath: string | null = null;
  let audioFilePath: string | null = null;

  try {
    logger.info('API:Upload', 'Video upload request received');

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = (formData.get('title') as string) || 'Uploaded Video';

    // Validate file exists
    if (!file) {
      logger.warn('API:Upload', 'No file provided in request');
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'No video file provided',
            code: ERROR_CODES.VALIDATION_ERROR,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    logger.debug('API:Upload', 'File received', {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      logger.warn('API:Upload', 'File size exceeds limit', { size: file.size, limit: MAX_FILE_SIZE });
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
            code: ERROR_CODES.INVALID_INPUT,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 413 }
      );
    }

    // Validate file type
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      logger.warn('API:Upload', 'Unsupported file type', { type: file.type });
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Unsupported file type. Supported: ${SUPPORTED_FORMATS.map(t => t.split('/')[1]).join(', ')}`,
            code: ERROR_CODES.INVALID_INPUT,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Save uploaded file to temporary directory
    const tempDir = path.join(os.tmpdir(), 'faithlence-uploads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    videoFilePath = path.join(tempDir, `${Date.now()}_${file.name}`);
    const buffer = await file.arrayBuffer();
    fs.writeFileSync(videoFilePath, Buffer.from(buffer));

    logger.debug('API:Upload', 'Video file saved to disk', { path: videoFilePath, size: file.size });

    // Extract audio from video file
    let transcription: string;
    try {
      logger.info('API:Upload', 'Extracting audio from uploaded video...');
      audioFilePath = await extractAudioFromFile(videoFilePath);

      logger.info('API:Upload', 'Transcribing audio with Gemini...');
      transcription = await transcribeAudioWithGemini(audioFilePath);

      logger.success('API:Upload', 'Audio extraction and transcription complete', {
        transcriptionLength: transcription.length,
        words: transcription.split(/\s+/).length,
      });
    } catch (error) {
      logger.error('API:Upload', 'Audio processing failed', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Audio processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

      // Clean up files before returning error
      if (videoFilePath) {
        try {
          fs.unlinkSync(videoFilePath);
        } catch {
          // Ignore cleanup errors
        }
      }
      if (audioFilePath) cleanupAudioFile(audioFilePath);

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
    // Connect to MongoDB and save (optional)
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
      console.error('[MongoDB Save Error]:', error);
      // Pass the error back for debugging (temporary)
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Database save failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            code: ERROR_CODES.DATABASE_ERROR,
            details: error
          },
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    // Clean up temporary files
    if (videoFilePath) {
      try {
        fs.unlinkSync(videoFilePath);
        logger.debug('API:Upload', 'Video file deleted', { path: videoFilePath });
      } catch {
        // Ignore cleanup errors
      }
    }
    if (audioFilePath) {
      cleanupAudioFile(audioFilePath);
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
    // Clean up on error
    if (videoFilePath) {
      try {
        fs.unlinkSync(videoFilePath);
      } catch {
        // Ignore cleanup errors
      }
    }
    if (audioFilePath) {
      cleanupAudioFile(audioFilePath);
    }

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
