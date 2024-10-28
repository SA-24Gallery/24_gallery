import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from "@/lib/auth";
import { RowDataPacket } from 'mysql2';

interface CreateNotificationBody {
    orderId: string;
    customerEmail: string;
    type: 'payment' | 'status';
    statusName?: string;  
}

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

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body: CreateNotificationBody = await req.json();
        const { orderId, customerEmail, type, statusName } = body;

        // new message ID
        const messageId = await generateMessageId();
        
        let notificationMessage = '';

        if (type === 'payment') {
            notificationMessage = `Order #${orderId} has been received and payment has been confirmed.`;
        } else if (type === 'status' && statusName) {  
            switch (statusName) {
                case 'Order completed':
                    notificationMessage = `Order #${orderId} has been completed.`;
                    break;
                case 'Shipped':
                    notificationMessage = `Order #${orderId} has been shipped / ready for pickup.`;
                    break;
                case 'Receive order':
                    notificationMessage = `Order #${orderId} has been received.`;
                    break;
                default:
                    notificationMessage = `Order #${orderId} status has been updated to: ${statusName}`;
            }
        }

        // Insert 
        const sql = `
            INSERT INTO NOTIFIED_MSG (Msg_id, Msg, Notified_date, Order_id, Is_read, Email)
            VALUES (?, ?, NOW(), ?, 0, ?)
        `;

        await query(sql, [messageId, notificationMessage, orderId, customerEmail]);

        return NextResponse.json({
            success: true,
            message: 'Notification created successfully',
            notificationMessage 
        });

    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}