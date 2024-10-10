import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

// Handler for GET requests to fetch specific order data for admin
export async function GET() {
  try {
    console.log('Admin API request to fetch specific order data'); // Log API request

    // SQL query to fetch specific fields from the orders table, users table, and join with the STATUS table
    const sql = `
    SELECT 
        o.Order_id AS orderId, 
        u.User_name AS customer,  -- Fetch user_name from USERS table
        o.Email AS email, 
        o.Shipping_option AS shippingOption, 
        DATE_FORMAT(o.Order_date, '%M %d, %Y') AS dateOrdered,  -- Format date
        DATE_FORMAT(o.Received_date, '%M %d, %Y') AS dateReceived,  -- Format date
        s.Status_name AS statusName 
        FROM orders o
        LEFT JOIN USERS u ON o.Email = u.Email  -- Join with USERS table on Email
        LEFT JOIN STATUS s ON o.Order_id = s.Order_id`; 

    // Log SQL query for debugging
    console.log('Executing SQL query for admin:', sql);

    // Execute the query to fetch the specific data for the admin page
    const orders = await query<RowDataPacket[]>(sql);

    // Log the query result for debugging
    console.log('Orders fetched:', orders);

    // Check if any records were found
    if (!orders || orders.length === 0) {
      console.log('No orders found');
      return NextResponse.json({ message: 'No orders found' }, { status: 404 });
    }

    // Return the fetched data as JSON for the admin page
    return NextResponse.json(orders, { status: 200 });
  } catch (error: any) {
    // Log error details for debugging
    console.error('Error fetching order data for admin:', error.message);
    console.error(error.stack); // Log the full stack trace for deeper debugging
    return NextResponse.json({ error: "Error fetching order data", errorMessage: error.message }, { status: 500 });
  }
}