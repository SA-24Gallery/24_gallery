// src/pages/api/close-pool.js

import { closePool } from '@/lib/db';
import { getSession } from 'next-auth/react';
import {IncomingMessage} from "node:http";

export default async function handler(req: Partial<IncomingMessage> & { body?: any }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { error?: string; message?: string; }): void; new(): any; }; }; }) {
    const session = await getSession({ req });

    if (!session || !session.user || session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        await closePool();
        res.status(200).json({ message: 'Database pool closed successfully' });
    } catch (error) {
        console.error('Error closing database pool:', error);
        res.status(500).json({ error: 'Error closing database pool' });
    }
}
