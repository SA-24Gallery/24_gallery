// src/app/api/upload/route.ts

import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();

    const files = formData.getAll('file') as File[];
    const sequences = formData.getAll('sequence') as string[];
    const productId = formData.get('productId') as string;

    if (!productId) {
      return NextResponse.json({ message: 'Product ID is required' }, { status: 400 });
    }

    const uploadPromises = files.map(async (file, index) => {
      const sequence = sequences[index] || (index + 1).toString();

      // Read the file content
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const extension = file.name.split('.').pop() || 'jpg';
      const originalFileName = file.name.split('.').slice(0, -1).join('.') || 'file';
      const fileName = `${productId}-${sequence}-${originalFileName}.${extension}`;
      const fileKey = `products/${productId}/${fileName}`;

      console.log('Uploading to S3 with key:', fileKey);

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: fileKey,
        Body: buffer,
        ContentType: file.type,
      });

      await s3Client.send(command);

      console.log('File uploaded successfully to:', fileKey);
    });

    await Promise.all(uploadPromises);

    return NextResponse.json({ success: true, message: 'Files uploaded successfully' });
  } catch (error: any) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Error uploading files', message: error.message },
      { status: 500 }
    );
  }
}