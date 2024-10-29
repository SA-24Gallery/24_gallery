export const dynamic = "force-dynamic";
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const queryParams: any[] = [];

    let sql = `
      WITH LatestCompletedStatus AS (
        SELECT 
          s1.Order_id,
          s1.Status_name,
          s1.Status_date,
          s1.Is_completed_status
        FROM Status s1
        INNER JOIN (
          SELECT Order_id, MAX(Status_date) as max_date
          FROM Status
          WHERE Is_completed_status = 1
          GROUP BY Order_id
        ) s2 ON s1.Order_id = s2.Order_id
        AND s1.Status_date = s2.max_date
        AND s1.Is_completed_status = 1
      )
      SELECT 
        o.Order_id AS orderId,
        u.User_name AS customer,
        u.Email AS email,
        o.Shipping_option AS shippingOption,
        o.Order_date AS dateOrdered,
        o.Received_date AS dateReceived,
        o.Payment_status AS paymentStatus,
        COALESCE(ls.Status_name, 'Waiting for process') AS status
      FROM Orders o
      LEFT JOIN Users u ON o.Email = u.Email
      LEFT JOIN LatestCompletedStatus ls ON o.Order_id = ls.Order_id
      WHERE 1=1
    `;

    if (filter === 'not-approve') {
      sql += ` AND o.Payment_status = 'N'`;
    } else if (filter === 'waiting-process') {
      sql += ` AND o.Payment_status = 'A'
               AND NOT EXISTS (
                 SELECT 1 
                 FROM LatestCompletedStatus lcs
                 WHERE lcs.Order_id = o.Order_id
               )`;
    } else if (filter === 'payment-pending') { 
      sql += ` AND o.Payment_status = 'P'`;
    } else if (filter === 'canceled') {
      sql += ` AND (
                o.Payment_status = 'C'
                OR EXISTS (
                  SELECT 1
                  FROM Status s
                  WHERE s.Order_id = o.Order_id
                  AND s.Status_name = 'Canceled'
                  AND s.Status_date = (
                    SELECT MAX(Status_date)
                    FROM Status
                    WHERE Order_id = o.Order_id
                  )
                )
              )`;
    } else if (filter === 'receive-order') {
      sql += ` AND o.Payment_status = 'A'
               AND EXISTS (
                 SELECT 1
                 FROM LatestCompletedStatus lcs
                 WHERE lcs.Order_id = o.Order_id
                 AND lcs.Status_name = 'Receive order'
               )`;
    } else if (filter === 'order-completed') {
      sql += ` AND o.Payment_status = 'A'
               AND EXISTS (
                 SELECT 1
                 FROM LatestCompletedStatus lcs
                 WHERE lcs.Order_id = o.Order_id
                 AND lcs.Status_name = 'Order completed'
               )`;
    } else if (filter === 'shipped') {
      sql += ` AND o.Payment_status = 'A'
               AND EXISTS (
                 SELECT 1
                 FROM LatestCompletedStatus lcs
                 WHERE lcs.Order_id = o.Order_id
                 AND lcs.Status_name = 'Shipped'
               )`;
    }
    
    sql += ` ORDER BY o.Order_date DESC`;

    const orders = await query<RowDataPacket[]>(sql, queryParams);
    return NextResponse.json(orders, { status: 200 });
    
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Error fetching orders', message: error.message },
      { status: 500 }
    );
  }
}