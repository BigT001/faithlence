import { NextRequest, NextResponse } from 'next/server';
import { initializeIndexes } from '@/lib/mongodb';

/**
 * Initialize application resources
 * Creates database indexes and runs startup tasks
 */
export async function POST(request: NextRequest) {
  try {
    await initializeIndexes();

    return NextResponse.json(
      {
        success: true,
        message: 'App initialized successfully',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error during app initialization:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to initialize app',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
