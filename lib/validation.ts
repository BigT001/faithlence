/**
 * Input Validation Utilities
 * Senior-grade validation with proper error messages
 */

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates transcription text
 */
export function validateTranscription(text: string): { valid: boolean; error?: string } {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Transcription text is required' };
  }

  const trimmed = text.trim();

  if (trimmed.length < 50) {
    return { valid: false, error: 'Transcription must be at least 50 characters' };
  }

  if (trimmed.length > 50000) {
    return { valid: false, error: 'Transcription exceeds maximum length (50,000 characters)' };
  }

  return { valid: true };
}

/**
 * Validates form data for file uploads
 */
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'File is required' };
  }

  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
  const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 500MB limit' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Allowed: MP4, MOV, AVI, WebM' };
  }

  return { valid: true };
}

/**
 * Sanitizes user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

/**
 * Validates ObjectId format
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}
