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
        let sql = `
        SELECT DISTINCT
          o.Order_id AS orderId,
          o.Email AS email,
          o.Shipping_option AS shippingOption,
          o.Order_date AS dateOrdered,
          o.Received_date AS dateReceived,
          o.Payment_status AS paymentStatus,
          CASE
            WHEN o.Payment_status = 'N' THEN 'Payment Not Approved'
            WHEN o.Payment_status = 'P' THEN 'Payment Pending'
            WHEN o.Payment_status = 'A' AND s.Status_name = 'Receive order' THEN 'Receive order'
            WHEN o.Payment_status = 'A' AND s.Status_name = 'Order completed' THEN 'Order completed'
            WHEN o.Payment_status = 'A' AND s.Status_name = 'Shipped' THEN 'Shipped'
            WHEN o.Payment_status = 'A' AND s.Status_name = 'Canceled' THEN 'Canceled'
            WHEN o.Payment_status = 'A' AND (s.Status_name IS NULL OR s.Status_name = '') THEN 'Waiting for process'
            ELSE 'Unknown'
          END AS status,
          COALESCE(s.Status_date, o.Order_date) AS statusDate
        FROM Orders o
        LEFT JOIN (
          SELECT 
            Order_id,
            Status_name,
            Status_date,
            ROW_NUMBER() OVER (PARTITION BY Order_id ORDER BY Status_date DESC) as rn
          FROM Status
          WHERE Is_completed_status = 1
        ) s ON o.Order_id = s.Order_id AND s.rn = 1
        WHERE 1=1
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