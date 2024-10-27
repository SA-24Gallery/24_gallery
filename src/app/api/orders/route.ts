// src/app/api/orders/route.ts

import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AWS from 'aws-sdk';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION!,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
});

const s3 = new AWS.S3();

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Function to list objects in a folder
async function listObjectsInFolder(folderPath: string): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Prefix: folderPath,
  });

  const response = await s3Client.send(command);

  const keys = response.Contents?.map((item) => item.Key!) || [];
  return keys;
}

// Define interfaces
interface Product {
  productId: string;
  albumName: string;
  folderPath: string;
  size: string;
  paperType: string;
  printingFormat: string;
  quantity: number;
  price: number;
}

interface Order {
  orderId: string;
  customer: string;
  phone: string;
  email: string;
  shippingOption: string | null;
  dateOrdered: Date | null;
  dateReceived: Date | null;
  paymentStatus: string | null;
  note: string | null;
  trackingNumber: string | null;
  products: Product[];
  status: string | null;
}

// POST request handler: Create or update an order
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
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

      const rows = await query<RowDataPacket[]>(
        `SELECT Product_id FROM Product
         WHERE Product_id LIKE '${prefix}%'
         ORDER BY CAST(SUBSTRING(Product_id, ${prefix.length + 1}) AS UNSIGNED) DESC LIMIT 1`
      );

      let nextProductId = '';

      if (rows.length > 0) {
        const lastProductId = rows[0].Product_id;
        const numberPart = lastProductId.substring(prefix.length);
        const nextNumber = parseInt(numberPart, 10) + 1;
        const nextNumberPadded = nextNumber.toString().padStart(numberLength, '0');
        nextProductId = prefix + nextNumberPadded;
      } else {
        nextProductId = prefix + '00001';
      }

      return nextProductId;
    };

    // Function to get the next order ID
    const getNextOrderId = async (): Promise<string> => {
      const prefix = 'ord';
      const numberLength = 5;

      const rows = await query<RowDataPacket[]>(
        `SELECT Order_id FROM Orders
         WHERE Order_id LIKE '${prefix}%'
         ORDER BY CAST(SUBSTRING(Order_id, ${prefix.length + 1}) AS UNSIGNED) DESC LIMIT 1`
      );

      let nextOrderId = '';

      if (rows.length > 0) {
        const lastOrderId = rows[0].Order_id;
        const numberPart = lastOrderId.substring(prefix.length);
        const nextNumber = parseInt(numberPart, 10) + 1;
        const nextNumberPadded = nextNumber.toString().padStart(numberLength, '0');
        nextOrderId = prefix + nextNumberPadded;
      } else {
        nextOrderId = prefix + '00001';
      }

      return nextOrderId;
    };

    const email = session.user.email;

    if (!email) {
      return NextResponse.json({ message: 'User email not found' }, { status: 400 });
    }

    // Check for existing order with order_date IS NULL (not yet finalized)
    const existingOrderRows = await query<RowDataPacket[]>(
      `SELECT Order_id FROM Orders WHERE email = ? AND order_date IS NULL`,
      [email]
    );

    let orderId: string;

    if (existingOrderRows.length > 0) {
      // Use existing Order_id
      orderId = existingOrderRows[0].Order_id;
    } else {
      // Create new order with generated Order_id
      orderId = await getNextOrderId();
      const insertOrderSql = `
        INSERT INTO Orders (Order_id, Email)
        VALUES (?, ?)
      `;
      await query<ResultSetHeader>(insertOrderSql, [orderId, email]);
    }

    // Get the next product ID
    const productId = await getNextProductId();

    // Set the folder path using productId
    const url = `products/${productId}/`;

    // Insert product details associated with the order
    const insertProductSql = `
      INSERT INTO Product (
        Product_id,
        Size,
        Paper_type,
        Product_qty,
        Printing_format,
        Price,
        Album_name,
        Url,
        Order_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query<ResultSetHeader>(
      insertProductSql,
      [
        productId,
        size,
        paperType,
        quantity,
        printingFormat,
        totalPrice,
        albumName,
        url, // Use the folder path with productId
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
      { error: 'Error creating or updating order', message: error.message },
      { status: 500 }
    );
  }
}

// GET request handler: Fetch orders or handle download
// GET request handler: Fetch orders or handle download
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download');
    const folderPath = searchParams.get('folderPath');

    if (download && folderPath) {
      // [Your existing code for handling downloads]
      // ...
    } else {
      // Continue with fetching orders
      const orderId = searchParams.get('orderId');
      const email = searchParams.get('email');
      const paymentStatus = searchParams.get('payment_status'); // Optional filter
      const orderDateNull = searchParams.get('order_date_null'); // Optional filter

      const isAdmin = session.user.role === 'A';
      const queryParams: any[] = [];

      let sql = `
        SELECT 
          o.Order_id AS orderId,
          u.User_name AS customer,
          u.Phone_number AS phone,
          p.Product_id AS productId,
          p.Album_name AS albumName,
          p.Url AS folderPath,
          p.Size AS size,
          p.Paper_type AS paperType,
          p.Printing_format AS printingFormat,
          p.Product_qty AS productQty,
          p.Price AS totalPrice,
          o.Email AS email,
          o.Shipping_option AS shippingOption,
          o.Payment_status AS paymentStatus,
          o.Note AS note,
          o.Order_date AS dateOrdered,
          o.Received_date AS dateReceived,
          o.Tracking_number AS trackingNumber,
          s.Status_name AS status
        FROM Orders o
        JOIN Users u ON o.Email = u.Email
        JOIN Product p ON o.Order_id = p.Order_id
        LEFT JOIN (
          SELECT s1.Order_id, s1.Status_name
          FROM Status s1
          INNER JOIN (
            SELECT Order_id, MAX(Status_date) AS MaxDate
            FROM Status
            GROUP BY Order_id
          ) s2 ON s1.Order_id = s2.Order_id AND s1.Status_date = s2.MaxDate
        ) s ON o.Order_id = s.Order_id
        WHERE 1=1
      `;

      if (!isAdmin) {
        sql += ` AND o.Email = ?`;
        queryParams.push(session.user.email);
      }

      if (orderId) {
        sql += ` AND o.Order_id = ?`;
        queryParams.push(orderId);
      }

      if (email && isAdmin) {
        sql += ` AND o.Email = ?`;
        queryParams.push(email);
      }

      if (paymentStatus) {
        sql += ` AND o.Payment_status = ?`;
        queryParams.push(paymentStatus);
      }

      if (orderDateNull === 'true') {
        sql += ` AND o.Order_date IS NULL`;
      }

      sql += ` ORDER BY o.Order_date DESC`;

      // Execute the optimized query
      const rows = await query<RowDataPacket[]>(sql, queryParams);

      // Transform and group orders and their products using a Map for efficiency
      const transformedOrdersMap = new Map<string, Order>();

      for (const row of rows) {
        let currentOrder = transformedOrdersMap.get(row.orderId);

        if (!currentOrder) {
          currentOrder = {
            orderId: row.orderId,
            customer: row.customer,
            phone: row.phone,
            email: row.email,
            shippingOption: row.shippingOption,
            dateOrdered: row.dateOrdered,
            dateReceived: row.dateReceived,
            paymentStatus: row.paymentStatus,
            note: row.note,
            trackingNumber: row.trackingNumber,
            products: [],
            status: row.status,
          };
          transformedOrdersMap.set(row.orderId, currentOrder);
        }

        const product: Product = {
          productId: row.productId,
          albumName: row.albumName,
          folderPath: row.folderPath,
          size: row.size,
          paperType: row.paperType,
          printingFormat: row.printingFormat,
          quantity: row.productQty,
          price: row.totalPrice,
        };

        currentOrder.products.push(product);
      }

      const transformedOrders = Array.from(transformedOrdersMap.values());

      if (!transformedOrders.length) {
        return NextResponse.json({ message: 'No orders found' }, { status: 404 });
      }

      return NextResponse.json(transformedOrders, { status: 200 });
    }
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
        { error: 'Error fetching orders', message: error.message },
        { status: 500 }
    );
  }
}

// Handler for PUT requests to update order status and details
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      orderId,
      status = null,                     // Default to null if not provided
      receivedDate = null,
      trackingNumber = null,
      shippingOption = null,
      note = null,
      payment_status = null,
      payment_deadline = null,
      order_date = null,
    } = body;

    // Log values for debugging
    console.log({
      orderId,
      status,
      receivedDate,
      trackingNumber,
      shippingOption,
      note,
      payment_status,
      payment_deadline,
      order_date,
    });

    // Ensure user has permission to update this order
    if (session.user.role !== 'A') {
      const orderRows = await query<RowDataPacket[]>(
        `SELECT email FROM Orders WHERE Order_id = ?`,
        [orderId]
      );

      if (!orderRows.length || orderRows[0].email !== session.user.email) {
        return NextResponse.json(
          { error: 'Unauthorized to modify this order' },
          { status: 403 }
        );
      }
    }

    // Update order with new details including status, tracking, shipping, note, payment status, and order_date
    const updateOrderSql = `
      UPDATE Orders 
      SET Received_date = ?,
          Tracking_number = ?,
          Shipping_option = ?,
          Note = ?,
          Payment_status = ?,
          Order_date = ?,
          Payment_deadline = ?
      WHERE Order_id = ?
    `;
    await query<ResultSetHeader>(updateOrderSql, [
      receivedDate,
      trackingNumber,
      shippingOption,
      note,
      payment_status,
      order_date,
      payment_deadline,
      orderId,
    ]);

    // Insert new status if provided
    if (status) {
      const insertStatusSql = `
        INSERT INTO Status (Order_id, Status_name, Status_date)
        VALUES (?, ?, NOW())
      `;
      await query<ResultSetHeader>(insertStatusSql, [orderId, status]);
    }

    return NextResponse.json(
      { success: true, message: 'Order updated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Error updating order', message: error.message },
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
    const productId = searchParams.get('productId'); // Get productId from query params

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Verify user has permission to modify this order
    if (session.user.role !== 'A') {
      const orderRows = await query<RowDataPacket[]>(
        `SELECT email FROM Orders WHERE Order_id = ?`,
        [orderId]
      );

      if (!orderRows.length || orderRows[0].email !== session.user.email) {
        return NextResponse.json(
          { error: 'Unauthorized to modify this order' },
          { status: 403 }
        );
      }
    }

    if (productId) {
      // Delete a specific product from the order
      const deleteProductSql = `DELETE FROM Product WHERE Product_id = ? AND Order_id = ?`;
      await query<ResultSetHeader>(deleteProductSql, [productId, orderId]);

      // Check if there are any products left in the order
      const productRows = await query<RowDataPacket[]>(
        `SELECT COUNT(*) as productCount FROM Product WHERE Order_id = ?`,
        [orderId]
      );

      if (productRows[0].productCount === 0) {
        // If no products left, delete the order
        const deleteOrderSql = `DELETE FROM Orders WHERE Order_id = ?`;
        await query<ResultSetHeader>(deleteOrderSql, [orderId]);
      }

      return NextResponse.json(
        { success: true, message: 'Product removed from order successfully' },
        { status: 200 }
      );
    } else {
      // Delete the entire order and associated products
      const deleteProductsSql = `DELETE FROM Product WHERE Order_id = ?`;
      await query<ResultSetHeader>(deleteProductsSql, [orderId]);

      const deleteOrderSql = `DELETE FROM Orders WHERE Order_id = ?`;
      await query<ResultSetHeader>(deleteOrderSql, [orderId]);

      return NextResponse.json(
        { success: true, message: 'Order cancelled successfully' },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Error cancelling order', message: error.message },
      { status: 500 }
    );
  }
}