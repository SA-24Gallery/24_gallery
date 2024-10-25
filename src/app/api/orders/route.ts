import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type OrderBody = {
  albumName: string;
  fileUrls: string[];
  size: string;
  paperType: string;
  printingFormat: string;
  quantity: number;
  totalPrice: number;
  email: string;
};

// Handler for POST requests to create new orders
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as OrderBody;
    const {
      albumName,
      fileUrls,
      size,
      paperType,
      printingFormat,
      quantity,
      totalPrice,
      email,
    } = body;

    // Insert the order into the database
    const insertOrderSql = `
      INSERT INTO orders (
        album_name,
        url,
        size,
        paper_type,
        printing_format,
        quantity,
        total_price,
        email,
        order_date,
        shipping_option,
        status_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'standard', 1)
    `;

    const result = await query<ResultSetHeader>(
      insertOrderSql,
      [
        albumName,
        JSON.stringify(fileUrls),
        size,
        paperType,
        printingFormat,
        quantity,
        totalPrice,
        email,
      ]
    );

    // Insert initial status
    const insertStatusSql = `
      INSERT INTO STATUS (Order_id, Status_name, Status_date)
      VALUES (?, 'Pending', NOW())
    `;
    
    await query<ResultSetHeader>(insertStatusSql, [result.insertId]);

    return NextResponse.json(
      { 
        success: true, 
        orderId: result.insertId,
        message: 'Order created successfully' 
      }, 
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: "Error creating order", message: error.message },
      { status: 500 }
    );
  }
}

// Handler for GET requests to fetch orders
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const email = searchParams.get('email');

    let sql = '';
    const queryParams: any[] = [];

    if (session.user.role === 'A') {
      sql = `
        SELECT 
          o.Order_id AS orderId,
          u.User_name AS customerName,
          o.album_name AS albumName,
          o.url AS fileUrls,
          o.size,
          o.paper_type AS paperType,
          o.printing_format AS printingFormat,
          o.quantity,
          o.total_price AS totalPrice,
          o.Email AS email,
          o.Shipping_option AS shippingOption,
          DATE_FORMAT(o.Order_date, '%M %d, %Y') AS orderDate,
          DATE_FORMAT(o.Received_date, '%M %d, %Y') AS receivedDate,
          s.Status_name AS status
        FROM orders o
        LEFT JOIN USERS u ON o.Email = u.Email
        LEFT JOIN (
          SELECT s1.Order_id, s1.Status_name
          FROM STATUS s1
          WHERE s1.Status_date = (
            SELECT MAX(s2.Status_date)
            FROM STATUS s2
            WHERE s2.Order_id = s1.Order_id
          )
        ) s ON o.Order_id = s.Order_id
        WHERE 1=1
      `;
    } else {
      sql = `
        SELECT 
          o.Order_id AS orderId,
          o.album_name AS albumName,
          o.url AS fileUrls,
          o.size,
          o.paper_type AS paperType,
          o.printing_format AS printingFormat,
          o.quantity,
          o.total_price AS totalPrice,
          o.Email AS email,
          o.Shipping_option AS shippingOption,
          DATE_FORMAT(o.Order_date, '%M %d, %Y') AS orderDate,
          DATE_FORMAT(o.Received_date, '%M %d, %Y') AS receivedDate,
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
        WHERE o.Email = ?
      `;
      queryParams.push(session.user.email);
    }

    // Add additional filters if provided
    if (orderId) {
      sql += ` AND o.Order_id = ?`;
      queryParams.push(orderId);
    }

    if (email && session.user.role === 'A') {
      sql += ` AND o.email = ?`;
      queryParams.push(email);
    }

    sql += ` ORDER BY o.Order_date DESC`;

    // Execute the query
    const orders = await query<RowDataPacket[]>(sql, queryParams);

    // Transform the results to parse the JSON stored file URLs
    const transformedOrders = orders.map(order => ({
      ...order,
      fileUrls: JSON.parse(order.fileUrls),
    }));

    if (!transformedOrders.length) {
      return NextResponse.json(
        { message: 'No orders found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transformedOrders, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: "Error fetching orders", message: error.message },
      { status: 500 }
    );
  }
}

// Handler for PUT requests to update order status
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'A') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, status, receivedDate } = body;

    // Update order status
    const updateOrderSql = `
      UPDATE orders 
      SET Received_date = ?
      WHERE Order_id = ?
    `;

    await query<ResultSetHeader>(updateOrderSql, [receivedDate, orderId]);

    // Insert new status
    const insertStatusSql = `
      INSERT INTO STATUS (Order_id, Status_name, Status_date)
      VALUES (?, ?, NOW())
    `;

    await query<ResultSetHeader>(insertStatusSql, [orderId, status]);

    return NextResponse.json(
      { success: true, message: 'Order updated successfully' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: "Error updating order", message: error.message },
      { status: 500 }
    );
  }
}

// Handler for DELETE requests to cancel orders
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Verify user has permission to cancel this order
    if (session.user.role !== 'A') {
      const orderSql = `SELECT email FROM orders WHERE Order_id = ?`;
      const [orderResult] = await query<RowDataPacket[]>(orderSql, [orderId]);
      
      if (!orderResult || orderResult[0].email !== session.user.email) {
        return NextResponse.json(
          { error: "Unauthorized to cancel this order" },
          { status: 403 }
        );
      }
    }

    // Update order status to cancelled
    const insertStatusSql = `
      INSERT INTO STATUS (Order_id, Status_name, Status_date)
      VALUES (?, 'Cancelled', NOW())
    `;

    await query<ResultSetHeader>(insertStatusSql, [orderId]);

    return NextResponse.json(
      { success: true, message: 'Order cancelled successfully' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: "Error cancelling order", message: error.message },
      { status: 500 }
    );
  }
}