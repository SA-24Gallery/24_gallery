import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AWS from 'aws-sdk';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import archiver from 'archiver';
import { PassThrough } from 'stream';

AWS.config.update({
  region: process.env.AWS_REGION!,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
});

const s3 = new AWS.S3();

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function listObjectsInFolder(folderPath: string): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Prefix: folderPath,
  });

  const response = await s3Client.send(command);

  const keys = response.Contents?.map((item) => item.Key!) || [];
  return keys;
}

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

    // Check order ที่ order_date เป็น NULL
    const existingOrderRows = await query<RowDataPacket[]>(
      `SELECT Order_id FROM Orders WHERE email = ? AND order_date IS NULL`,
      [email]
    );

    let orderId: string;

    if (existingOrderRows.length > 0) {
      orderId = existingOrderRows[0].Order_id;
    } else {
      // สร้าง order ใหม่ใช้ generated Order_id
      orderId = await getNextOrderId();
      const insertOrderSql = `
        INSERT INTO Orders (Order_id, Email)
        VALUES (?, ?)
      `;
      await query<ResultSetHeader>(insertOrderSql, [orderId, email]);
    }

    const productId = await getNextProductId();

    // Set the folder path
    const url = `products/${productId}/`;

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
        url,
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
    const download = searchParams.get('download');
    const folderPath = searchParams.get('folderPath');

    if (download && folderPath) {
      // Verify that user has access to this folderPath
      const sql = `
        SELECT p.Product_id, p.Order_id, o.Email
        FROM Product p
        JOIN Orders o ON p.Order_id = o.Order_id
        WHERE p.Url = ?
      `;

      const rows = await query<RowDataPacket[]>(sql, [folderPath]);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Folder not found or access denied' }, { status: 404 });
      }

      const product = rows[0];

      if (session.user.role !== 'A' && product.Email !== session.user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const command = new ListObjectsV2Command({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Prefix: folderPath,
      });

      const response = await s3Client.send(command);

      const objects = response.Contents || [];

      if (objects.length === 0) {
        return NextResponse.json({ error: 'No files found in the folder' }, { status: 404 });
      }

      const passthroughStream = new PassThrough();

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(passthroughStream);

      for (const object of objects) {
        const key = object.Key!;
        const objectStream = s3.getObject({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: key,
        }).createReadStream();

        const fileName = key.substring(folderPath.length);

        archive.append(objectStream, { name: fileName });
      }

      archive.finalize();

      return new Response(passthroughStream as any, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${folderPath.replace(/\//g, '_')}.zip"`,
        },
      });
    } else {
      const orderId = searchParams.get('orderId');
      const email = searchParams.get('email');
      const paymentStatus = searchParams.get('payment_status'); 
      const orderDateNull = searchParams.get('order_date_null');

      let sql = '';
      const queryParams: any[] = [];

    if (session.user.role === 'A') {
      // Admin fetch all orders
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

      if (paymentStatus) {
        sql += ` AND o.Payment_status = ?`;
        queryParams.push(paymentStatus);
      }

      if (orderDateNull === 'true') {
        sql += ` AND o.Order_date IS NULL`;
      }

      sql += ` ORDER BY o.Order_date DESC`;

      const rows = await query<RowDataPacket[]>(sql, queryParams);

      const transformedOrders: Order[] = [];

      for (const order of rows) {
        // Find or create the current order
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

        const product: Product = {
          productId: order.productId,
          albumName: order.albumName,
          folderPath: order.folderPath, 
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
    }
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
        { error: 'Error fetching orders', message: error.message },
        { status: 500 }
    );
  }
}

// PUT request handler: update order status and details
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      orderId,
      status = null,                    
      receivedDate = null,
      trackingNumber = null,
      shippingOption = null,
      note = null,
      payment_status = null,
      payment_deadline = null,
      order_date = null,
    } = body;

    // Check user permission
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

    // Update order
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

    // Insert new status
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

// DELETE request handler
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const productId = searchParams.get('productId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // ตรวจสอบว่า user has permission to modify order
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
      const deleteProductSql = `DELETE FROM Product WHERE Product_id = ? AND Order_id = ?`;
      await query<ResultSetHeader>(deleteProductSql, [productId, orderId]);

      // เช็คว่ามี product เหลือใน order ไหม
      const productRows = await query<RowDataPacket[]>(
        `SELECT COUNT(*) as productCount FROM Product WHERE Order_id = ?`,
        [orderId]
      );

      if (productRows[0].productCount === 0) {
        // ถ้าไม่มี product เหลือจะลบ order
        const deleteOrderSql = `DELETE FROM Orders WHERE Order_id = ?`;
        await query<ResultSetHeader>(deleteOrderSql, [orderId]);
      }

      return NextResponse.json(
        { success: true, message: 'Product removed from order successfully' },
        { status: 200 }
      );
    } else {
      // ลบทั้ง order
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