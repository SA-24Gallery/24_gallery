import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT() {
    try {
        const sql = 'UPDATE NOTIFIED_MSG SET Is_read = 1 WHERE Is_read = 0';
        await query(sql);

        return NextResponse.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Failed to mark notifications as read:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
