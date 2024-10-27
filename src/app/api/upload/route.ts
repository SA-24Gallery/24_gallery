// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { console } from "next/dist/compiled/@edge-runtime/primitives";

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('file') as File[];
    const productId = formData.get('productId') as string;

    if (!productId) {
      return NextResponse.json({ message: 'Product ID is required' }, { status: 400 });
    }

    if (files.length === 0) {
      return NextResponse.json({ message: 'No files provided' }, { status: 400 });
    }

    // Determine folder path based on the productId prefix
    let folderKey: string;
    if (productId.startsWith('receipts/')) {
      // For receipts, use the path as is
      folderKey = `${productId}/`;
    } else {
      // For product photos, maintain the products/ prefix
      folderKey = `products/${productId}/`;
    }

    // Upload each file
    const uploadPromises = files.map(async (file, index) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Get file extension - only for product photos
      // For receipts, always use jpg
      const extension = productId.startsWith('receipts/') 
        ? 'jpg'  // Force jpg for receipts
        : (file.name.split('.').pop() || 'jpg');  // Keep original extension for products

      // Set filename based on the type
      const fileName = productId.startsWith('receipts/')
        ? `receipt_${index + 1}.jpg`  // Always jpg for receipts
        : `${productId}_${index + 1}.${extension}`;

      const fileKey = `${folderKey}${fileName}`;
      console.log(`Uploading file ${fileName} to folder ${folderKey}`);

      // Upload file to S3
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: fileKey,
        Body: buffer,
        ContentType: file.type,
      });

      await s3Client.send(command);
    });

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    // Generate S3 folder URL
    const s3FolderUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${folderKey}`;
    console.log(s3FolderUrl);

    // Return the folder URL
    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${files.length} files`,
      folderUrl: s3FolderUrl,
      folderKey: folderKey
    });

  } catch (error: any) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Error uploading files', message: error.message },
      { status: 500 }
    );
  }
}