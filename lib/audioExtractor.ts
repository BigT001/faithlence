/**
 * Media Transcription Service (Serverless-Compatible)
 * 
 * Sends audio/video files DIRECTLY to Google Gemini API for transcription.
 * No ffmpeg dependency — works on Vercel, Netlify, and any serverless platform.
 */

import { logger } from '@/lib/logger';

/**
 * Transcribe audio or video using Google Gemini API.
 * Accepts raw base64 data and mime type — no file system needed.
 */
export async function transcribeMediaWithGemini(
  base64Data: string,
  mimeType: string
): Promise<string> {
  try {
    logger.info('Transcriber', 'Starting Gemini transcription', {
      mimeType,
      sizeBytes: Math.round((base64Data.length * 3) / 4), // approximate original size
    });

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable not set');
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Models to try in order of preference
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-flash-latest',
    ];

    let lastError: any = null;
    let response: any = null;

    for (const modelName of modelsToTry) {
      try {
        logger.info('Transcriber', `Attempting transcription with model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        // Retry logic for rate limits
        let retries = 0;
        const maxRetries = 3;

        while (retries < maxRetries) {
          try {
            response = await model.generateContent([
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data,
                },
              },
              'Transcribe this audio/video to text. Return ONLY the full transcription text, nothing else. If there is speech, transcribe it word for word. If there is no speech, describe what you hear.',
            ]);
            break; // Success — exit retry loop
          } catch (error: any) {
            if (error.message?.includes('429') || error.status === 429) {
              retries++;
              const delay = Math.pow(2, retries) * 1000;
              logger.warn('Transcriber', `Rate limited, retrying in ${delay}ms...`, { retry: retries });
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              throw error; // Non-retryable error — try next model
            }
          }
        }

        if (response) {
          logger.success('Transcriber', `Successfully transcribed with model: ${modelName}`);
          break; // Success — exit model loop
        }
      } catch (error: any) {
        lastError = error;
        logger.warn('Transcriber', `Model ${modelName} failed`, { error: error.message });
        continue; // Try next model
      }
    }

    if (!response) {
      throw lastError || new Error('Transcription failed: All models exhausted');
    }

    const transcription = response.response.text();

    if (!transcription || transcription.trim().length === 0) {
      throw new Error('Gemini returned an empty transcription. The audio may be too short, silent, or in an unsupported format.');
    }

    logger.success('Transcriber', 'Transcription complete', {
      transcriptionLength: transcription.length,
      words: transcription.split(/\s+/).length,
    });

    return transcription;
  } catch (error) {
    logger.error('Transcriber', 'Gemini transcription failed', error, {
      errorMsg: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clean up temporary audio files (legacy — kept for backward compatibility)
 */
export function cleanupAudioFile(_audioFilePath: string): void {
  // No-op in serverless mode — we don't write temp files anymore
}
