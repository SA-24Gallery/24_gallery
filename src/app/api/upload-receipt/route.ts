
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import path from 'path';

// Initialize S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// Allowed file extensions
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.svg'];

export async function POST(request: Request) {
    try {
        // ตรวจสอบการเข้าสู่ระบบ
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const orderId = formData.get('orderId') as string;
        const file = formData.get('file') as File;

        // ตรวจสอบว่าได้ส่ง orderId และไฟล์มาแล้วหรือไม่
        if (!orderId) {
            return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
        }

        if (!file) {
            return NextResponse.json({ message: 'No file provided' }, { status: 400 });
        }

        // ดึงสกุลไฟล์จากชื่อไฟล์ต้นฉบับ
        const originalName = file.name;
        const extension = path.extname(originalName).toLowerCase();

        // ตรวจสอบว่าสกุลไฟล์ถูกต้องหรือไม่
        if (!allowedExtensions.includes(extension)) {
            throw new Error(`File extension ${extension} is not allowed.`);
        }

        // สร้างชื่อไฟล์ใหม่ตามรูปแบบ receipt_<orderId>.<extension>
        const fileName = `receipt_${orderId}${extension}`;

        const folderKey = 'receipts/';

        const fileKey = `${folderKey}${fileName}`;

        // อ่านไฟล์เป็น Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // สร้างคำสั่งอัปโหลดไปยัง S3
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: fileKey,
            Body: buffer,
            ContentType: file.type,
        });

        // ส่งคำสั่งอัปโหลดไปยัง S3
        await s3Client.send(command);

        // สร้าง URL ของไฟล์ใน S3
        const s3FileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

        // คืนค่า URL ของไฟล์
        return NextResponse.json({
            success: true,
            message: `Successfully uploaded ${fileName}`,
            fileUrl: s3FileUrl,
        });

    } catch (error: any) {
        console.error('Error uploading receipt:', error);
        return NextResponse.json(
            { error: 'Error uploading receipt', message: error.message },
            { status: 500 }
        );
    }
}
