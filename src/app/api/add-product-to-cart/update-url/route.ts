import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ResultSetHeader } from 'mysql2/promise';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { productId, url } = body;

        if (!productId || !url) {
            return NextResponse.json(
                { error: 'Product ID and URL are required' },
                { status: 400 }
            );
        }

        // Update the product URL in the database
        const updateSql = `
              UPDATE Product 
              SET Url = ?
              WHERE product_id = ?
            `;


        await query<ResultSetHeader>(updateSql, [url, productId]);

        return NextResponse.json(
            { success: true, message: 'Product URL updated successfully' },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error updating product URL:', error);
        return NextResponse.json(
            { error: 'Error updating product URL', message: error.message },
            { status: 500 }
        );
    }
}