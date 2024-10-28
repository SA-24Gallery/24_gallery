import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
        return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
    }

    try {
        // Query to get receipt_pic from Orders table
        const rows = await query(`
            SELECT receipt_pic FROM Orders WHERE Order_id = ?
        `, [orderId]);

        // ตรวจสอบว่า rows เป็น RowDataPacket[] หรือไม่
        if (Array.isArray(rows) && rows.length > 0) {
            const receiptPic = (rows as RowDataPacket[])[0].receipt_pic;
            return NextResponse.json({ receiptUrl: receiptPic }, { status: 200 });
        } else {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }
    } catch (error: any) {
        console.error('Error fetching receipt:', error);
        return NextResponse.json({ error: 'Error fetching receipt', message: error.message }, { status: 500 });
    }
}
