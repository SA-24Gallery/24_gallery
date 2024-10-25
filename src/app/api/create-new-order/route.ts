// src/app/api/create-new-order/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";

async function getNextStatusId(): Promise<string> {
    const prefix = 'stt';
    const numberLength = 5;

    const result = await query<RowDataPacket[]>(
        `SELECT status_id FROM Status
     ORDER BY CAST(SUBSTRING(status_id, ${prefix.length + 1}) AS UNSIGNED) DESC LIMIT 1`
    );

    let nextStatusId = '';

    if (result.length > 0) {
        const lastStatusId = result[0].status_id;
        const numberPart = lastStatusId.substring(prefix.length);
        const nextNumber = parseInt(numberPart, 10) + 1;
        const nextNumberPadded = nextNumber.toString().padStart(numberLength, '0');
        nextStatusId = prefix + nextNumberPadded;
    } else {
        nextStatusId = prefix + '00001';
    }

    return nextStatusId;
}

async function createOrderStatuses(orderId: string): Promise<void> {
    // Get base status ID for sequence
    const baseStatusId = await getNextStatusId();
    const baseNumber = parseInt(baseStatusId.substring(3));

    // Define status sequence
    const statuses = [
        {
            name: 'Receive order',
            isCompleted: 0,
            date: null
        },
        {
            name: 'Order completed',
            isCompleted: 0,
            date: null
        },
        {
            name: 'Shipped',
            isCompleted: 0,
            date: null
        }
    ];

    // Insert all statuses
    const insertStatusSql = `
    INSERT INTO Status (
      status_id,
      Status_name,
      Status_date,
      Order_id,
      Is_completed_status
    ) VALUES (?, ?, ?, ?, ?)
  `;

    for (let i = 0; i < statuses.length; i++) {
        const status = statuses[i];
        const statusNumber = (baseNumber + i).toString().padStart(5, '0');
        const statusId = `stt${statusNumber}`;

        await query<ResultSetHeader>(
            insertStatusSql,
            [
                statusId,
                status.name,
                status.date,
                orderId,
                status.isCompleted
            ]
        );
    }
}

async function getNextOrderId(): Promise<string> {
    const prefix = 'ord';
    const numberLength = 5;

    const result = await query<RowDataPacket[]>(
        `SELECT order_id FROM orders
     ORDER BY CAST(SUBSTRING(order_id, ${prefix.length + 1}) AS UNSIGNED) DESC LIMIT 1`
    );

    let nextOrderId = '';

    if (result.length > 0) {
        const lastOrderId = result[0].order_id;
        const numberPart = lastOrderId.substring(prefix.length);
        const nextNumber = parseInt(numberPart, 10) + 1;
        const nextNumberPadded = nextNumber.toString().padStart(numberLength, '0');
        nextOrderId = prefix + nextNumberPadded;
    } else {
        nextOrderId = prefix + '00001';
    }

    return nextOrderId;
}

export async function createNewOrder(email: string): Promise<string> {
    const orderId = await getNextOrderId();

    // Insert new order
    const insertOrderSql = `
    INSERT INTO orders (
      order_id,  
      order_date,
      email,
      shipping_option,
      payment_status,
      payment_deadline
    ) VALUES (?, null, ?, 'Pick up', 'N', null)
  `;

    await query<ResultSetHeader>(
        insertOrderSql,
        [orderId, email]
    );

    // Create order statuses
    await createOrderStatuses(orderId);

    return orderId;
}

// API Route handler remains the same...
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const email = session.user.email;
        if (!email) {
            return NextResponse.json({ message: 'User email not found' }, { status: 400 });
        }

        const orderId = await createNewOrder(email);

        return NextResponse.json(
            {
                success: true,
                orderId: orderId,
                message: 'New order created successfully'
            },
            { status: 201 }
        );

    } catch (error: any) {
        console.error('Error creating new order:', error);
        return NextResponse.json(
            { error: "Error creating new order", message: error.message },
            { status: 500 }
        );
    }
}