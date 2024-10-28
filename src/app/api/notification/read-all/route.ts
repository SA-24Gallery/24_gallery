import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";

export async function PUT() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Not authenticated" });
        }
        const email = session?.user?.email

        if (!email) {
            return NextResponse.json(
                { message: 'Email is required' },
                { status: 400 }
            );
        }

        const sql = 'UPDATE NOTIFIED_MSG SET Is_read = 1 WHERE Is_read = 0 AND Email = ?';
        await query(sql, [email]);

        return NextResponse.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Failed to mark notifications as read:', error);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
