import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
    try {
        const conn = await connectDB();
        if (conn) {
            return NextResponse.json({
                success: true,
                message: 'MongoDB connected successfully',
                state: conn.connection.readyState,
                host: conn.connection.host
            });
        } else {
            return NextResponse.json({
                success: false,
                message: 'MongoDB failed to connect'
            }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
