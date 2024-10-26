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

// Function to generate a pre-signed URL
function getPreSignedUrl(key: string): string {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    Expires: 60 * 60, // URL expires in 1 hour
  };

  return s3.getSignedUrl('getObject', params);
}

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
  fileUrls: string[];
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
    const paymentStatus = searchParams.get('payment_status'); // Optional filter
    const orderDateNull = searchParams.get('order_date_null'); // Optional filter

    let sql = '';
    const queryParams: any[] = [];

    if (session.user.role === 'A') {
      // Admin: Fetch all orders
      sql = `
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
        LEFT JOIN Users u ON o.Email = u.Email
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
      // User: Fetch only their orders
      sql = `
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
        LEFT JOIN Users u ON o.Email = u.Email
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

    // Add Optional Filters
    if (paymentStatus) {
      sql += ` AND o.Payment_status = ?`;
      queryParams.push(paymentStatus);
    }

    if (orderDateNull === 'true') {
      sql += ` AND o.Order_date IS NULL`;
    }

    sql += ` ORDER BY o.Order_date DESC`;

    const rows = await query<RowDataPacket[]>(sql, queryParams);

    // Transform and group orders and their products
    const transformedOrders: Order[] = [];

    for (const order of rows) {
      // Find or create the current order in transformedOrders
      let currentOrder = transformedOrders.find((o) => o.orderId === order.orderId);

      if (!currentOrder) {
        currentOrder = {
          orderId: order.orderId,
          customer: order.customer,
          phone: order.phone,
          email: order.email,
          shippingOption: order.shippingOption,
          dateOrdered: order.dateOrdered,
          dateReceived: order.dateReceived,
          paymentStatus: order.paymentStatus,
          note: order.note,
          trackingNumber: order.trackingNumber,
          products: [],
          status: order.status,
        };
        transformedOrders.push(currentOrder);
      }

      // List files in the S3 folder and generate pre-signed URLs
      let fileUrls: string[] = [];
      const folderPath = order.folderPath; // Url contains folder path

      if (folderPath) {
        try {
          const fileKeys = await listObjectsInFolder(folderPath);
          fileUrls = fileKeys.map((key: string) => {
            console.log('Generating pre-signed URL for key:', key);
            return getPreSignedUrl(key);
          });
        } catch (e) {
          console.error('Error listing objects:', e);
        }
      }

      const product: Product = {
        productId: order.productId,
        albumName: order.albumName,
        fileUrls: fileUrls, // Use generated URLs
        size: order.size,
        paperType: order.paperType,
        printingFormat: order.printingFormat,
        quantity: order.productQty,
        price: order.totalPrice,
      };

      currentOrder.products.push(product);
    }

    if (!transformedOrders.length) {
      return NextResponse.json({ message: 'No orders found' }, { status: 404 });
    }

    return NextResponse.json(transformedOrders, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Error fetching orders', message: error.message },
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
    const { orderId, status, receivedDate, trackingNumber } = body;  // เพิ่ม trackingNumber

    // Update order status and tracking number
    const updateOrderSql = `
      UPDATE Orders 
      SET Received_date = ?,
          Tracking_number = ?
      WHERE Order_id = ?
    `;
    await query<ResultSetHeader>(updateOrderSql, [receivedDate, trackingNumber, orderId]);

    // Insert new status
    const insertStatusSql = `
      INSERT INTO Status (Order_id, Status_name, Status_date)
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