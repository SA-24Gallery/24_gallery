import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import { authOptions } from "@/lib/auth";

interface Notification extends RowDataPacket {
    Msg_id: number;
    Msg: string;
    Notified_date: string;
    Order_id: number;
    Is_read: number;
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user?.email;
    if (!userEmail) {
        return NextResponse.json({ message: 'User email not found' }, { status: 400 });
    }

    try {
        const sql = `
            SELECT * 
            FROM NOTIFIED_MSG
            WHERE email = ?
            ORDER BY Notified_date DESC
        `;
        const notifications = await query<Notification[]>(sql, [userEmail]);

        return NextResponse.json(notifications);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}