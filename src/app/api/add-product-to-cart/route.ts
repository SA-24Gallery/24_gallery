import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {createNewOrder} from "@/app/api/create-new-order/route";
// src/app/api/add-product-to-cart
// Define the OrderBody type for creating an order
type OrderBody = {
    albumName: string;
    fileUrls: string[];
    size: string;
    paperType: string;
    printingFormat: string;
    quantity: number;
    totalPrice: number;
};
// POST request handler: Create or update an order
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json() as OrderBody;
        const {
            albumName,
            size,
            paperType,
            printingFormat,
            quantity,
            totalPrice,
        } = body;

        // Function to get the next product ID
        const getNextProductId = async (): Promise<string> => {
            const prefix = 'prd';
            const numberLength = 5;

            const result = await query<RowDataPacket[]>(
                `SELECT product_id FROM Product
     ORDER BY CAST(SUBSTRING(product_id, ${prefix.length + 1}) AS UNSIGNED) DESC LIMIT 1`
            );

            let nextProductId = '';

            if (result.length > 0) {
                const lastProductId = result[0].product_id;
                const numberPart = lastProductId.substring(prefix.length);
                const nextNumber = parseInt(numberPart, 10) + 1;
                const nextNumberPadded = nextNumber.toString().padStart(numberLength, '0');
                nextProductId = prefix + nextNumberPadded;
            } else {
                nextProductId = prefix + '00001';
            }

            return nextProductId;
        };

        const email = session.user.email;

        if (!email) {
            return NextResponse.json({ message: 'User email not found' }, { status: 400 });
        }

        // Check for existing order with payment_status 'N' (Not paid)
        const existingOrder = await query<RowDataPacket[]>(
            `SELECT Order_id FROM orders WHERE email = ? AND order_date IS NULL`,
            [email]
        );

        let orderId;

        if (existingOrder.length > 0) {
            // Use existing Order_id
            orderId = existingOrder[0].Order_id;
        } else {
            // Create new order using the separated functionality
            orderId = await createNewOrder(email);
        }

        // Get the next product ID
        const productId = await getNextProductId();

        // Insert product details associated with the order
        const insertProductSql = `
      INSERT INTO Product (
        product_id,
        album_name,
        size,
        paper_type,
        printing_format,
        Product_qty,
        price,
        order_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

        await query<ResultSetHeader>(
            insertProductSql,
            [
                productId,
                albumName,
                size,
                paperType,
                printingFormat,
                quantity,
                totalPrice,
                orderId,
            ]
        );

        return NextResponse.json(
            {
                success: true,
                orderId: orderId,
                productId: productId,
                message: 'Order updated successfully',
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Error creating or updating order:', error);
        return NextResponse.json(
            { error: "Error creating or updating order", message: error.message },
            { status: 500 }
        );
    }
}