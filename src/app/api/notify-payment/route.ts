import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

async function generateMessageId(): Promise<string> {
  try {
    const rows = await query<RowDataPacket[]>(
      'SELECT Msg_id FROM NOTIFIED_MSG ORDER BY Msg_id DESC LIMIT 1'
    );

    if (rows.length === 0) {
      return 'msg00001';
    }

    const lastId = rows[0].Msg_id;
    const currentNum = parseInt(lastId.substring(3));
    const nextNum = currentNum + 1;
    return `msg${nextNum.toString().padStart(5, '0')}`;
  } catch (error) {
    console.error('Error generating message ID:', error);
    throw error;
  }
}

export async function POST(
  req: Request,
  context: { params: { [key: string]: string | string[] } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
    }

    // Generate message ID
    const messageId = await generateMessageId();

    // Get admin email
    const adminRows = await query<RowDataPacket[]>(
      'SELECT Email FROM USERS WHERE Role = "A" LIMIT 1'
    );

    if (adminRows.length === 0) {
      return NextResponse.json({ message: 'Admin user not found' }, { status: 404 });
    }

    const adminEmail = adminRows[0].Email;

    const message = `New payment received for order #${orderId}.`;
    
    await query(
      'INSERT INTO NOTIFIED_MSG (Msg_id, Msg, Notified_date, Order_id, Is_read, Email) VALUES (?, ?, NOW(), ?, ?, ?)',
      [messageId, message, orderId, 0, adminEmail]
    );

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      messageId,
    });

  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { 
        error: 'Error sending notification', 
        message: error.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
