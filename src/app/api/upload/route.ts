import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const chunks: Uint8Array[] = [];
    const reader = req.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    let done: boolean | undefined = false;
    while (!done) {
      const { done: isDone, value } = await reader.read();
      if (value) {
        chunks.push(value);
      }
      done = isDone;
    }

    const buffer = Buffer.concat(chunks);
    const contentType = req.headers.get('content-type') || 'application/octet-stream';
    
    // Generate a unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = contentType.split('/')[1] || 'jpg';
    const fileName = `${timestamp}-${randomString}.${extension}`;
    
    // Create the file path in the receipt folder
    const fileKey = `receipt/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: fileKey,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}