/**
 * API Response Standardization
 * Consistent response format across all endpoints
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: Record<string, any>;
  };
  timestamp: string;
}

/**
 * Create a success response
 */
export function successResponse<T>(data: T, statusCode: number = 200): [T, number] {
  return [data as any, statusCode];
}

/**
 * Create an error response
 */
export function errorResponse(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: Record<string, any>
): [{ error: { message: string; code?: string; details?: Record<string, any> } }, number] {
  return [
    {
      error: {
        message,
        ...(code && { code }),
        ...(details && { details }),
      },
    } as any,
    statusCode,
  ];
}

/**
 * Standardized error codes
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  DATABASE_ERROR: 'DATABASE_ERROR',
};
