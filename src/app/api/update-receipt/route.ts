import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ResultSetHeader } from 'mysql2/promise';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: 'ap-southeast-2',  // Using ap-southeast-2 for Sydney region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

export async function POST(request: Request) {
  try {
    // Verify session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { orderId, receiptUrl, paymentStatus } = await request.json();
    if (!orderId || !paymentStatus || !receiptUrl) {
      console.log("Missing fields:", { orderId, receiptUrl, paymentStatus });
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Convert base64/URL to buffer if needed
    let receiptBuffer: Buffer;
    if (receiptUrl.startsWith('data:')) {
      // Handle base64 encoded image
      const base64Data = receiptUrl.split(',')[1];
      receiptBuffer = Buffer.from(base64Data, 'base64');
    } else {
      // Handle URL - fetch the image first
      const response = await fetch(receiptUrl);
      const arrayBuffer = await response.arrayBuffer();
      receiptBuffer = Buffer.from(arrayBuffer);
    }

    // Set the S3 key with the correct path format
    const s3Key = `receipts/receipt_${orderId}`;
    
    // Full S3 URL that will be stored in the database
    const s3Url = `https://24-gallery-photos.s3.ap-southeast-2.amazonaws.com/${s3Key}`;

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: '24-gallery-photos',
      Key: s3Key,
      Body: receiptBuffer,
      ContentType: 'image/jpeg',
    });

    await s3Client.send(uploadCommand);

    console.log("Attempting to update order:", { orderId, s3Url, paymentStatus });

    // Update order in the database with the full S3 URL
    const updateQuery = `
      UPDATE Orders
      SET Payment_status = ?, Receipt_pic = ?
      WHERE Order_id = ?
    `;
    const result = (await query(updateQuery, [paymentStatus, s3Url, orderId])) as ResultSetHeader;
    console.log("Query result affected rows:", result.affectedRows);

    // Check if the update was successful
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Order not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Order updated successfully',
      receiptUrl: s3Url
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Error updating order', message: error.message },
      { status: 500 }
    );
  }
}