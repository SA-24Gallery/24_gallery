// src/app/api/test/route.ts
import { NextResponse } from 'next/server';
import { query_data } from '@/lib/db'; // ปรับเส้นทางให้ถูกต้อง

export async function GET(request: Request) {
    try {
        const sql = 'SELECT * FROM users'; // แทนที่ด้วยคำสั่ง SQL ของคุณ
        const data = await query_data(sql);
        return NextResponse.json(data); // คืนค่า JSON response
    } catch (error) {
        console.error('Error fetching data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }); // คืนค่าข้อผิดพลาด
    }
}
