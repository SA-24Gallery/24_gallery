// src/app/api/orders/order-list/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";

interface OrderRow extends RowDataPacket {
    Order_id: string;
    Date_Ordered: Date;
    Date_Received: Date;
    Delivery_Option: string;
    Status: string;
    Customer_Name: string;
    Customer_Email: string;
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    try {
        // Simplified query without email filter for now
        const sql = `
            SELECT 
                Order_id as orderId,
                Date_Ordered as dateOrdered,
                Date_Received as dateReceived,
                Delivery_Option as shippingOption,
                Status as paymentStatus,
                CASE 
                    WHEN Status = 'A' AND Date_Received IS NULL THEN 'Processing'
                    WHEN Status = 'A' AND Date_Received IS NOT NULL THEN 'Completed'
                    ELSE Status 
                END as status,
                NOW() as statusDate
            FROM Order_List_View 
            WHERE Customer_Email = ?
            ORDER BY Date_Ordered DESC
        `;

        const orders = await query<OrderRow[]>(sql, [session.user.email]);

        // Transform dates to ISO strings for JSON serialization
        const formattedOrders = orders.map(order => ({
            orderId: order.orderId,
            customer: order.customer,
            email: order.email,
            shippingOption: order.shippingOption,
            dateOrdered: order.dateOrdered ? new Date(order.dateOrdered).toISOString() : '',
            dateReceived: order.dateReceived ? new Date(order.dateReceived).toISOString() : '',
            paymentStatus: order.paymentStatus,
            status: order.status,
            statusDate: new Date().toISOString()
        }));

        return NextResponse.json(formattedOrders);

    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}