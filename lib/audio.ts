import { logger } from '@/lib/logger';
import { analyzeWithGemini } from '@/lib/gemini';

interface AudioTranscriptionResult {
  transcription: string;
  duration?: number;
  size?: number;
}

/**
 * Transcribe audio file using Google Gemini API
 * Converts audio to base64 and sends to Gemini for transcription
 */
export async function transcribeAudioWithGemini(
  audioBuffer: Buffer,
  mimeType: string,
): Promise<AudioTranscriptionResult> {
  try {
    logger.info('Audio:Gemini', 'Starting Gemini audio transcription', { mimeType, sizeBytes: audioBuffer.length });

    // Import Gemini dynamically to avoid initialization at module load time
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert buffer to base64
    const audioBase64 = audioBuffer.toString('base64');

    logger.debug('Audio:Gemini', 'Sending audio to Gemini', { 
      mimeType, 
      sizeBytes: audioBuffer.length,
      base64Length: audioBase64.length
    });

    // Call Gemini API with audio
    const response = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: audioBase64,
        },
      },
      'Transcribe this audio to text. Return ONLY the exact transcription of what was said, nothing else. Be accurate and capture all words exactly as spoken.',
    ]);

    const transcription = response.response.text();

    logger.success('Audio:Gemini', 'Gemini transcription complete', {
      textLength: transcription.length,
      words: transcription.split(/\s+/).filter(w => w.length > 0).length,
    });

    return {
      transcription,
      size: audioBuffer.length,
    };
  } catch (error) {
    logger.error('Audio:Gemini', 'Gemini API transcription failed', error, {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Failed to transcribe audio: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Process transcribed audio with Gemini AI analysis
 * Generates summary, captions, hashtags, faith stories, and scriptures
 */
export async function processAudioTranscription(
  transcription: string,
  videoTitle: string = 'Uploaded Video'
): Promise<any> {
  try {
    logger.info('Audio:Analysis', 'Processing audio transcription with Gemini AI', {
      textLength: transcription.length,
      title: videoTitle,
    });

    // Use the Gemini analyzer to process the transcription
    const analysis = await analyzeWithGemini(transcription);

    logger.success('Audio:Analysis', 'Audio analysis complete', {
      hasSummary: !!analysis.summary,
      hasCaptions: !!analysis.captions,
      hashtagCount: analysis.hashtags?.length || 0,
    });

    return analysis;
  } catch (error) {
    logger.error('Audio:Analysis', 'Audio analysis failed', error, {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
    throw error;
  }
}

/**
 * Get MIME type from file extension
 */
export function getMimeTypeFromExtension(extension: string): string {
  const ext = extension.toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.webm': 'audio/webm',
    '.aac': 'audio/aac',
    '.flac': 'audio/flac',
  };
  return mimeTypes[ext] || 'audio/mpeg';
}

/**
 * Validate audio file size
 */
export function validateAudioFileSize(sizeBytes: number, maxSizeMB: number = 25): { valid: boolean; error?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (sizeBytes > maxSizeBytes) {
    return {
      valid: false,
      error: `Audio file exceeds ${maxSizeMB}MB limit. Current size: ${(sizeBytes / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  if (sizeBytes < 1024) {
    return {
      valid: false,
      error: 'Audio file is too small (must be at least 1KB)',
    };
  }

  return { valid: true };
}
