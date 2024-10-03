import { NextResponse } from 'next/server';
import { query } from '@/lib/db'; // ปรับเส้นทางนำเข้าตามที่จำเป็น


export async function GET(request: Request) {
    try {
        const sql = 'SELECT * FROM users';
        const data = await query(sql);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
