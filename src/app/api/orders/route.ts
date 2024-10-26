import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createNewOrder } from "@/app/api/create-new-order/route";

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

    // Function to get the next product ID
    const getNextProductId = async (): Promise<string> => {
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
    };

    const email = session.user.email;

    if (!email) {
      return NextResponse.json({ message: 'User email not found' }, { status: 400 });
    }

    // Check for existing order with payment_status 'N' (Not paid) or order_date IS NULL
    const existingOrder = await query<RowDataPacket[]>(
      `SELECT Order_id FROM orders WHERE email = ? AND order_date IS NULL`,
      [email]
    );

    let orderId;

    if (existingOrder.length > 0) {
      // Use existing Order_id
      orderId = existingOrder[0].Order_id;
    } else {
      // Create new order using the separated functionality
      orderId = await createNewOrder(email);
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
        orderId,
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
          p.Album_name AS albumName,
          p.Url AS fileUrls,
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
          p.Album_name AS albumName,
          p.Url AS fileUrls,
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

    // **Add Optional Filters**
    if (paymentStatus) {
      sql += ` AND o.Payment_status = ?`;
      queryParams.push(paymentStatus);
    }

    if (orderDateNull === 'true') {
      sql += ` AND o.Order_date IS NULL`;
    }

    sql += ` ORDER BY o.Order_date DESC`;

    const orders = await query<RowDataPacket[]>(sql, queryParams);

    // Transform and group orders and their products
    const orderMap = new Map<string, any>();

    orders.forEach(order => {
      if (!orderMap.has(order.orderId)) {
        // Initialize the order in the map
        orderMap.set(order.orderId, {
          orderId: order.orderId,
          customer: order.customer,
          phone: order.phone,
          email: order.email,
          shippingOption: order.shippingOption,
          dateOrdered: order.dateOrdered,
          dateReceived: order.dateReceived,
          paymentStatus: order.paymentStatus,
          note: order.note,
          products: [],
          status: order.status
        });
      }

      // Add the product to the products array
      const currentOrder = orderMap.get(order.orderId);

      // Safely parse fileUrls
      let fileUrls: string[];
      if (order.fileUrls) {
        try {
          // Try parsing as JSON
          fileUrls = JSON.parse(order.fileUrls);
          if (!Array.isArray(fileUrls)) {
            // If it's not an array, wrap it in an array
            fileUrls = [fileUrls];
          }
        } catch (e) {
          // If parsing fails, assume it's a plain string
          fileUrls = [order.fileUrls];
        }
      } else {
        fileUrls = [];
      }

      currentOrder.products.push({
        albumName: order.albumName,
        fileUrls: fileUrls,
        size: order.size,
        paperType: order.paperType,
        printingFormat: order.printingFormat,
        quantity: order.productQty,
        price: order.totalPrice
      });
    });

    const transformedOrders = Array.from(orderMap.values());

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

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
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

      if (!orderResult || orderResult.email !== session.user.email) {
        return NextResponse.json(
          { error: "Unauthorized to cancel this order" },
          { status: 403 }
        );
      }
    }

    // Delete products associated with the order
    const deleteProductsSql = `DELETE FROM Product WHERE Order_id = ?`;
    await query<ResultSetHeader>(deleteProductsSql, [orderId]);

    // Delete the order
    const deleteOrderSql = `DELETE FROM Orders WHERE Order_id = ?`;
    await query<ResultSetHeader>(deleteOrderSql, [orderId]);

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