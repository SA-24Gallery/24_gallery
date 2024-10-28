import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {console} from "next/dist/compiled/@edge-runtime/primitives";

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
    const productId = formData.get('productId') as string;

    if (!productId) {
      return NextResponse.json({ message: 'Product ID is required' }, { status: 400 });
    }

    if (files.length === 0) {
      return NextResponse.json({ message: 'No files provided' }, { status: 400 });
    }

    // สร้าง path สำหรับ folder
    const folderKey = `products/${productId}/`;

    // อัพโหลดไฟล์แต่ละไฟล์
    const uploadPromises = files.map(async (file, index) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // ดึงนามสกุลไฟล์
      const extension = file.name.split('.').pop() || 'jpg';

      // ตั้งชื่อไฟล์ตามรูปแบบ product_id_sequence
      const fileName = `${productId}_${index + 1}.${extension}`;
      const fileKey = `${folderKey}${fileName}`;

      // อัพโหลดไฟล์ขึ้น S3
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: fileKey,
        Body: buffer,
        ContentType: file.type,
      });

      await s3Client.send(command);
    });

    await Promise.all(uploadPromises);

    // สร้าง URL ของ folder
    const s3FolderUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${folderKey}`;
    // ส่งคืน URL ของ folder
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