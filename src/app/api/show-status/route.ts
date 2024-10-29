export const dynamic = "force-dynamic";
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');
        
        if (!orderId) {
            return NextResponse.json({ error: 'No order ID provided' }, { status: 400 });
        }
        
        const sql = `
            SELECT
                Status_id AS statusId,
                Status_name AS statusName,
                DATE_FORMAT(Status_date, '%Y-%m-%d %H:%i:%s') AS statusDate,
                Is_completed_status AS isCompleted
            FROM Status
            WHERE Order_id = ?
            ORDER BY FIELD(Status_name, 'Receive order', 'Order completed', 'Shipped')
        `;
        
        const rows = await query<RowDataPacket[]>(sql, [orderId]);
        return NextResponse.json(rows, { status: 200 });
    } catch (error: any) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Error fetching statuses' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const orderId = body.orderId;
        
        if (!orderId) {
            return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
        }

        // ตรวจสอบสถานะการยกเลิก
        const checkCancelStatusQuery = `
            SELECT Status_name, Is_completed_status 
            FROM Status 
            WHERE Order_id = ? AND Status_name = 'Canceled'
            AND Is_completed_status = 1
        `;
        const [cancelStatus] = await query<RowDataPacket[]>(checkCancelStatusQuery, [orderId]);

        if (cancelStatus) {
            // ถ้าออเดอร์ถูกยกเลิกแล้ว ไม่อนุญาตให้อัปเดตสถานะใดๆ
            return NextResponse.json({
                error: 'Cannot update status: Order is canceled',
                orderId: orderId
            }, { status: 400 });
        }

        // ตรวจสอบว่ากำลังจะอัปเดตสถานะอะไร
        const findStatusQuery = `
            SELECT Status_id, Status_name, Is_completed_status
            FROM Status
            WHERE Order_id = ? AND Is_completed_status = 0
            ORDER BY FIELD(Status_name, 'Receive order', 'Order completed', 'Shipped')
            LIMIT 1
        `;
        const [statusToUpdate] = await query<RowDataPacket[]>(findStatusQuery, [orderId]);

        // ถ้าไม่มีสถานะที่จะอัปเดต
        if (!statusToUpdate) {
            return NextResponse.json({
                error: 'No status found to update',
                orderId: orderId
            }, { status: 400 });
        }

        // ตรวจสอบสถานะการชำระเงิน
        const checkPaymentStatusQuery = `
            SELECT Payment_status 
            FROM Orders 
            WHERE Order_id = ?
        `;
        const [paymentStatus] = await query<RowDataPacket[]>(checkPaymentStatusQuery, [orderId]);

        // ถ้าออเดอร์ถูกยกเลิก (Payment_status = 'C') ไม่อนุญาตให้อัปเดตสถานะ
        if (paymentStatus && paymentStatus.Payment_status === 'C') {
            return NextResponse.json({
                error: 'Cannot update status: Order is canceled',
                orderId: orderId
            }, { status: 400 });
        }

        // อัปเดตสถานะ
        const updateQuery = `
            UPDATE Status
            SET Is_completed_status = 1,
                Status_date = CURRENT_TIMESTAMP
            WHERE Status_id = ?
            AND Order_id = ?
            AND Is_completed_status = 0
            AND Status_name != 'Canceled'
        `;
        
        await query(updateQuery, [statusToUpdate.Status_id, orderId]);

        // ดึงข้อมูลสถานะทั้งหมดมาใหม่
        const getUpdatedStatusQuery = `
            SELECT
                Status_id AS statusId,
                Status_name AS statusName,
                DATE_FORMAT(Status_date, '%Y-%m-%d %H:%i:%s') AS statusDate,
                Is_completed_status AS isCompleted
            FROM Status
            WHERE Order_id = ?
            ORDER BY FIELD(Status_name, 'Receive order', 'Order completed', 'Shipped')
        `;
        
        const updatedStatuses = await query<RowDataPacket[]>(getUpdatedStatusQuery, [orderId]);

        return NextResponse.json({
            success: true,
            message: 'Status updated successfully',
            statuses: updatedStatuses
        }, { status: 200 });
    } catch (error: any) {
        console.error('Error in PUT:', error);
        return NextResponse.json({
            error: 'Error updating status',
            details: error.message
        }, { status: 500 });
    }
}