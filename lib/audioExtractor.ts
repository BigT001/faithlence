/**
 * Audio Extraction Service
 * Handles extraction of audio/transcripts from uploaded files
 * Audio files are transcribed directly using Google Gemini API
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import { logger } from '@/lib/logger';
import ffmpegStatic from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import ffprobeStatic from 'ffprobe-static';

// Set ffmpeg path
let ffmpegPath: string | null = ffmpegStatic;

// Enhanced path resolution for different environments
if (ffmpegPath && !fs.existsSync(ffmpegPath)) {
  // Try to resolve properly if the default path is invalid (common in some monorepos or pnpm setups)
  try {
    const pkgPath = require.resolve('ffmpeg-static');
    const possiblePath = path.join(path.dirname(pkgPath), os.platform() === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
    if (fs.existsSync(possiblePath)) {
      ffmpegPath = possiblePath;
    }
  } catch (e) {
    logger.warn('AudioExtractor:Setup', 'Failed to resolve ffmpeg-static path via require', e);
  }
}

// Windows specific fix (legacy support)
if (os.platform() === 'win32' && ffmpegPath && (ffmpegPath.startsWith('\\ROOT') || !fs.existsSync(ffmpegPath))) {
  const possiblePaths = [
    path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
    path.join(process.cwd(), '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
    path.join(process.cwd(), 'resources', 'ffmpeg.exe'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      ffmpegPath = p;
      break;
    }
  }
}

if (ffmpegPath && fs.existsSync(ffmpegPath)) {
  logger.info('AudioExtractor:Setup', 'Setting ffmpeg path', { path: ffmpegPath });
  ffmpeg.setFfmpegPath(ffmpegPath);
} else {
  logger.warn('AudioExtractor:Setup', 'ffmpeg-static binary not found. Will attempt to use system ffmpeg if available.');
  // We don't error here, allowing fallback to system PATH "ffmpeg", but we log it.
}

// Set ffprobe path
let ffprobePath: string | null = ffprobeStatic.path;

if (ffprobePath && !fs.existsSync(ffprobePath)) {
  try {
    const pkgPath = require.resolve('ffprobe-static');
    const possiblePath = path.join(path.dirname(pkgPath), 'bin', os.platform() === 'win32' ? 'win32' : 'linux', os.arch(), os.platform() === 'win32' ? 'ffprobe.exe' : 'ffprobe');
    if (fs.existsSync(possiblePath)) {
      ffprobePath = possiblePath;
    }
  } catch (e) { /* ignore */ }
}

if (os.platform() === 'win32' && ffprobePath && (ffprobePath.startsWith('\\ROOT') || !fs.existsSync(ffprobePath))) {
  const possiblePaths = [
    path.join(process.cwd(), 'node_modules', 'ffprobe-static', 'bin', 'win32', 'x64', 'ffprobe.exe'),
    path.join(process.cwd(), '..', 'node_modules', 'ffprobe-static', 'bin', 'win32', 'x64', 'ffprobe.exe'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      ffprobePath = p;
      break;
    }
  }
}

if (ffprobePath && fs.existsSync(ffprobePath)) {
  logger.info('AudioExtractor:Setup', 'Setting ffprobe path', { path: ffprobePath });
  ffmpeg.setFfprobePath(ffprobePath);
} else {
  logger.warn('AudioExtractor:Setup', 'ffprobe-static binary not found. Will attempt to use system ffprobe if available.');
}

const TEMP_DIR = path.join(os.tmpdir(), 'faithlence-audio');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Extract audio from an uploaded video file
 * Converts any video format to MP3 using fluent-ffmpeg
 */
export async function extractAudioFromFile(inputFilePath: string): Promise<string> {
  const fileName = path.basename(inputFilePath, path.extname(inputFilePath));
  const audioFile = path.join(TEMP_DIR, `${fileName}_audio.mp3`);

  // Skip if already processed
  if (fs.existsSync(audioFile)) {
    logger.debug('AudioExtractor:File', 'Using cached audio file', { fileName });
    return audioFile;
  }

  try {
    logger.info('AudioExtractor:File', 'Starting audio extraction from file', {
      inputFile: fileName,
      outputFile: audioFile
    });

    return new Promise((resolve, reject) => {
      // Use standard MP3 for best compatibility with Gemini and lower file size
      ffmpeg(inputFilePath)
        .noVideo()
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .audioChannels(1) // Mono is enough for transcription and smaller file
        .format('mp3')
        .on('start', (commandLine) => {
          logger.debug('AudioExtractor:File', 'ffmpeg command started', { command: commandLine });
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            logger.debug('AudioExtractor:File', 'Extraction progress', { percent: progress.percent.toFixed(1) + '%' });
          }
        })
        .on('end', () => {
          const stats = fs.statSync(audioFile);
          logger.success('AudioExtractor:File', 'Audio extracted successfully', {
            fileName,
            fileSize: `${(stats.size / 1024 / 1024).toFixed(2)}MB`,
            path: audioFile
          });
          resolve(audioFile);
        })
        .on('error', (error: Error) => {
          logger.error('AudioExtractor:File', 'ffmpeg conversion failed', error, {
            fileName,
            errorMsg: error.message,
          });

          if (fs.existsSync(audioFile)) {
            try { fs.unlinkSync(audioFile); } catch { }
          }
          reject(new Error(`Failed to extract audio: ${error.message}`));
        })
        .save(audioFile);
    });
  } catch (error) {
    logger.error('AudioExtractor:File', 'Audio extraction failed', error, {
      fileName,
      errorMsg: error instanceof Error ? error.message : 'Unknown error',
    });

    // Clean up partial file
    if (fs.existsSync(audioFile)) {
      try {
        fs.unlinkSync(audioFile);
      } catch {
        // Ignore cleanup errors
      }
    }

    throw new Error(`Failed to extract audio from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Transcribe audio file using Google Gemini API
 */
export async function transcribeAudioWithGemini(audioFilePath: string): Promise<string> {
  try {
    logger.info('AudioExtractor:Gemini', 'Starting Gemini transcription', {
      file: path.basename(audioFilePath),
      size: fs.statSync(audioFilePath).size
    });

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable not set');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-native-audio-latest' });

    // Read audio file as base64
    const audioBuffer = fs.readFileSync(audioFilePath);
    const audioBase64 = audioBuffer.toString('base64');

    // Determine mime type based on extension
    const ext = path.extname(audioFilePath).toLowerCase();
    const mimeType = ext === '.mp3' ? 'audio/mpeg' :
      ext === '.m4a' ? 'audio/mp4' :
        ext === '.wav' ? 'audio/wav' : 'audio/mp4';

    logger.debug('AudioExtractor:Gemini', 'Sending audio to Gemini API', {
      sizeBytes: audioBuffer.length,
      mimeType: mimeType
    });

    // Verified models available in this environment
    const modelsToTry = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest'];
    let lastError: any = null;
    let response: any = null;

    for (const modelName of modelsToTry) {
      try {
        logger.info('AudioExtractor:Gemini', `Attempting transcription with model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        // Call Gemini API with audio with retry logic
        let retries = 0;
        const maxRetries = 2;

        while (retries < maxRetries) {
          try {
            response = await model.generateContent([
              {
                inlineData: {
                  mimeType: mimeType,
                  data: audioBase64,
                },
              },
              'Transcribe this audio to text. Return ONLY the full transcription text, nothing else.',
            ]);
            break;
          } catch (error: any) {
            if (error.message?.includes('429') || error.status === 429) {
              retries++;
              const delay = Math.pow(2, retries) * 1000;
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              throw error;
            }
          }
        }

        if (response) {
          logger.success('AudioExtractor:Gemini', `Successfully used model: ${modelName}`);
          break;
        }
      } catch (error: any) {
        lastError = error;
        logger.warn('AudioExtractor:Gemini', `Model ${modelName} failed`, { error: error.message });
        continue;
      }
    }

    if (!response) {
      throw lastError || new Error('Transcription failed: All models exhausted');
    }

    const transcription = response.response.text();

    logger.success('AudioExtractor:Gemini', 'Transcription complete', {
      transcriptionLength: transcription.length,
      words: transcription.split(/\s+/).length,
    });

    return transcription;
  } catch (error) {
    logger.error('AudioExtractor:Gemini', 'Gemini transcription failed', error, {
      errorMsg: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clean up temporary audio files
 */
export function cleanupAudioFile(audioFilePath: string): void {
  try {
    if (fs.existsSync(audioFilePath)) {
      fs.unlinkSync(audioFilePath);
      logger.debug('AudioExtractor', 'Temporary audio file deleted', { path: audioFilePath });
    }
  } catch (error) {
    logger.warn('AudioExtractor', 'Failed to cleanup audio file', {
      path: audioFilePath,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
