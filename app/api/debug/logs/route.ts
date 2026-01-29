import { NextResponse } from 'next/server';
import { getLogs, clearLogs } from '@/lib/logger';

export async function GET() {
  const logs = getLogs();

  return NextResponse.json(
    {
      success: true,
      totalLogs: logs.length,
      logs,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

export async function DELETE() {
  clearLogs();

  return NextResponse.json(
    {
      success: true,
      message: 'Logs cleared',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
