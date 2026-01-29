import { NextRequest, NextResponse } from 'next/server';
import { getLogs } from '@/lib/logger';

export async function GET(request: NextRequest) {
    const logs = getLogs();
    return NextResponse.json({
        success: true,
        count: logs.length,
        logs: logs.reverse().slice(0, 50), // Last 50 logs
    });
}
