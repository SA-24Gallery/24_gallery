import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }


    let sql = '';

    if (session.user.role === 'A') {
      sql = `SELECT o.Order_id AS orderId, u.User_name AS customer, o.Email AS email, o.Shipping_option AS delivery, 
             DATE_FORMAT(o.Order_date, '%M %d, %Y') AS dateOrdered,  -- Format date as 'October 01, 2024'
             DATE_FORMAT(o.Received_date, '%M %d, %Y') AS dateReceived,  -- Format date as 'October 05, 2024'
             s.Status_name AS status 
             FROM orders o 
             LEFT JOIN USERS u ON o.Email = u.Email 
             LEFT JOIN STATUS s ON o.Order_id = s.Order_id;`;
    } else if (session.user.role === 'U') {
      const userEmail = session.user.email;
            sql = `
        SELECT o.Order_id AS orderId, o.Email AS email, o.Shipping_option AS delivery, 
               DATE_FORMAT(o.Order_date, '%M %d, %Y') AS dateOrdered,  -- Format date as 'October 01, 2024'
               DATE_FORMAT(o.Received_date, '%M %d, %Y') AS dateReceived,  -- Format date as 'October 05, 2024'
               s.Status_name AS status 
        FROM orders o 
        LEFT JOIN (
          SELECT s1.Order_id, s1.Status_name
          FROM STATUS s1
          WHERE s1.Status_date = (
            SELECT MAX(s2.Status_date) 
            FROM STATUS s2 
            WHERE s2.Order_id = s1.Order_id
          )
        ) s ON o.Order_id = s.Order_id
        WHERE o.Email = ?;
      `;  
    }

  
    const orders = await query<RowDataPacket[]>(sql, [session.user.role === 'U' ? session.user.email : null]);

    if (!orders || orders.length === 0) {
      return NextResponse.json({ message: 'No orders found' }, { status: 404 });
    }

    return NextResponse.json(orders, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: "Error fetching orders", errorMessage: error.message }, { status: 500 });
  }
}
