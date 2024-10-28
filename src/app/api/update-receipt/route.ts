import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { ResultSetHeader } from 'mysql2/promise';

interface UpdateReceiptBody {
  orderId: string;
  receiptUrl: string;
  paymentStatus: string;
}

export async function POST(request: Request) {
  try {
    // ตรวจสอบการเข้าสู่ระบบ
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateReceiptBody = await request.json();
    const { orderId, receiptUrl, paymentStatus } = body;

    // ตรวจสอบข้อมูลที่ได้รับ
    if (!orderId || !receiptUrl || !paymentStatus) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // อัปเดตคำสั่งซื้อในฐานข้อมูล
    const updateQuery = `
      UPDATE Orders
      SET Payment_status = ?, Receipt_pic = ?
      WHERE Order_id = ?
    `;

    const result = (await query(updateQuery, [paymentStatus, receiptUrl, orderId])) as ResultSetHeader;

    // ตรวจสอบว่าการอัปเดตสำเร็จหรือไม่
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Order not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: {
        orderId,
        receiptUrl,
        paymentStatus
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
        { error: 'Error updating order', message: error.message },
        { status: 500 }
    );
  }
}
