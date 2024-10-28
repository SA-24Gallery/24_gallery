import { closePool } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import { NextResponse } from 'next/server';

export const POST = async (req: Request) => {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await closePool();
        return NextResponse.json({ message: 'Database pool closed successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error closing database pool:', error);
        return NextResponse.json({ error: 'Error closing database pool' }, { status: 500 });
    }
};
