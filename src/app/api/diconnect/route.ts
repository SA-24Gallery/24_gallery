import { NextRequest, NextResponse } from 'next/server';
import { closePool } from '@/lib/db';

let isClosing = false;

export async function POST(request: NextRequest) {
    try {
        if (!isClosing) {
            isClosing = true;
            await closePool();
            return NextResponse.json({ message: 'Database pool closed successfully' });
        } else {
            return NextResponse.json({ message: 'Database pool is already closing' });
        }
    } catch (error) {
        console.error('Failed to close database pool:', error);
        isClosing = false;
        return NextResponse.json(
            { error: 'Failed to close database pool' },
            { status: 500 }
        );
    }
}