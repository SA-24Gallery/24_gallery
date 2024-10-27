// src/app/api/status/route.ts
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId'); 

    if (!orderId) {
      return NextResponse.json({ error: 'No order ID provided' }, { status: 400 });
    }


    const sql = `
      SELECT 
        Status_name AS statusName,
        Status_date AS statusDate,
        Is_completed_status AS isCompleted
      FROM Status
      WHERE Order_id = ?
      ORDER BY Status_date ASC
    `;

    const rows = await query<RowDataPacket[]>(sql, [orderId]);

    return NextResponse.json(rows, { status: 200 });
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Error fetching statuses', message: error.message }, { status: 500 });
  }
}
