import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

// Function to get the next product ID
async function getNextProductId(): Promise<string> {
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
}

async function getNextOrderId(): Promise<string> {
  const prefix = 'ord';
  const numberLength = 5;

  const result = await query<RowDataPacket[]>(
      `SELECT order_id FROM ORDER
     ORDER BY CAST(SUBSTRING(order_id, ${prefix.length + 1}) AS UNSIGNED) DESC LIMIT 1`
  );

  let nextOrderId = '';

  if (result.length > 0) {
    const lastOrderId = result[0].product_id;
    const numberPart = lastOrderId.substring(prefix.length);
    const nextNumber = parseInt(numberPart, 10) + 1;
    const nextNumberPadded = nextNumber.toString().padStart(numberLength, '0');
    nextOrderId = prefix + nextNumberPadded;
  } else {
    nextOrderId = prefix + '00001';
  }

  return nextOrderId;
}

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
      fileUrls,
      size,
      paperType,
      printingFormat,
      quantity,
      totalPrice,
    } = body;


    const email = session.user.email;

    // Check for existing order with payment_status 'N' (Not paid)
    const existingOrder = await query<RowDataPacket[]>(
        `SELECT Order_id FROM orders WHERE email = ? AND payment_status = 'N'`,
        [email]
    );

    let orderId;

    if (existingOrder.length > 0) {
      // Use existing Order_id
      orderId = existingOrder[0].Order_id;
    } else {
      // Insert new order
      const insertOrderSql = `
        INSERT INTO orders (
          order_id,  
          order_date,
          email,
          shipping_option,
          payment_status,
          payment_deadline
        ) VALUES (?, NOW(), ?, 'standard', 'N', DATE_ADD(NOW(), INTERVAL 7 DAY))
      `;

      const result = await query<ResultSetHeader>(
          insertOrderSql,
          [getNextOrderId(), email]
      );
      orderId = result.insertId;

      // Insert initial status into the Status table
      const insertStatusSql = `
        INSERT INTO Status (Order_id, Status_name, Status_date, Is_completed_status)
        VALUES (?, 'Pending', NOW(), 0)
      `;

      await query<ResultSetHeader>(insertStatusSql, [orderId]);
    }

    // Get the next product ID
    const productId = await getNextProductId();

    // Insert product details associated with the order
    const insertProductSql = `
      INSERT INTO Product (
        product_id,
        album_name,
        url,
        size,
        paper_type,
        printing_format,
        Product_qty,
        price,
        order_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query<ResultSetHeader>(
        insertProductSql,
        [
          productId,
          albumName,
          JSON.stringify(fileUrls),
          size,
          paperType,
          printingFormat,
          quantity,
          totalPrice,
          orderId, // Use the existing or new Order_id
        ]
    );

    return NextResponse.json(
        {
          success: true,
          orderId: orderId,
          message: 'Order updated successfully'
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


// GET request handler: Fetch orders
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
      // สำหรับ admin: ดึงข้อมูลทั้งหมดรวมถึงชื่อและเบอร์โทร
      sql = `
        SELECT 
          o.Order_id AS orderId,
          u.User_name AS customer,  -- Fetch the customer name for admin
          u.Phone_number AS phone,  -- Fetch the phone number for admin
          p.Album_name AS albumName,
          p.Url AS fileUrls,
          p.Size,
          p.Paper_type AS paperType,
          p.Printing_format AS printingFormat,
          p.Product_qty AS productQty,
          p.Price AS totalPrice,
          o.Email AS email,
          o.Shipping_option AS shippingOption,
          DATE_FORMAT(o.Order_date, '%M %d, %Y') AS dateOrdered,
          DATE_FORMAT(o.Received_date, '%M %d, %Y') AS dateReceived,
          s.Status_name AS status
        FROM Orders o
        LEFT JOIN Users u ON o.Email = u.Email  -- Join Users table to get customer name and phone
        LEFT JOIN Product p ON o.Order_id = p.Order_id
        LEFT JOIN (
          SELECT s1.Order_id, s1.Status_name
          FROM Status s1
          WHERE s1.Status_date = (
            SELECT MAX(s2.Status_date)
            FROM Status s2
            WHERE s2.Order_id = s1.Order_id
          )
        ) s ON o.Order_id = s.Order_id
        WHERE 1=1
      `;
    } else {
      // สำหรับ user: ดึงข้อมูลของ user ที่เข้าสู่ระบบเท่านั้น
      sql = `
        SELECT 
          o.Order_id AS orderId,
          u.User_name AS customer,  -- Fetch the customer name for user
          u.Phone_number AS phone,  -- Fetch the phone number for user
          p.Album_name AS albumName,
          p.Url AS fileUrls,
          p.Size,
          p.Paper_type AS paperType,
          p.Printing_format AS printingFormat,
          p.Product_qty AS productQty,
          p.Price AS totalPrice,
          o.Email AS email,
          o.Shipping_option AS shippingOption,
          DATE_FORMAT(o.Order_date, '%M %d, %Y') AS dateOrdered,
          DATE_FORMAT(o.Received_date, '%M %d, %Y') AS dateReceived,
          s.Status_name AS status
        FROM Orders o
        LEFT JOIN Users u ON o.Email = u.Email  -- Join Users table to get customer name and phone
        LEFT JOIN Product p ON o.Order_id = p.Order_id
        LEFT JOIN (
          SELECT s1.Order_id, s1.Status_name
          FROM Status s1
          WHERE s1.Status_date = (
            SELECT MAX(s2.Status_date)
            FROM Status s2
            WHERE s2.Order_id = s1.Order_id
          )
        ) s ON o.Order_id = s.Order_id
        WHERE o.Email = ?
      `;
      queryParams.push(session.user.email);
    }

    if (orderId) {
      sql += ` AND o.Order_id = ?`;
      queryParams.push(orderId);
    }

    if (email && session.user.role === 'A') {
      sql += ` AND o.Email = ?`;
      queryParams.push(email);
    }

    sql += ` ORDER BY o.Order_date DESC`;

    const orders = await query<RowDataPacket[]>(sql, queryParams);

    const transformedOrders = orders.map(order => ({
      orderId: order.orderId,
      customer: order.customer,  // Map customer name
      phone: order.phone,        // Map phone number
      email: order.email,
      shippingOption: order.shippingOption,
      dateOrdered: order.dateOrdered,
      dateReceived: order.dateReceived,
      products: orders.filter(o => o.orderId === order.orderId).map(product => ({
        albumName: product.albumName,
        fileUrls: Array.isArray(product.fileUrls) ? product.fileUrls : [product.fileUrls],
        size: product.size,
        paperType: product.paperType,
        printingFormat: product.printingFormat,
        quantity: product.productQty,
        price: product.totalPrice
      })),
      status: order.status
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

