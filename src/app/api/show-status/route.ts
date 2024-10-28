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

        // ค้นหาสถานะถัดไปที่จะอัพเดท
        const findStatusQuery = `
            SELECT Status_id, Status_name, Is_completed_status
            FROM Status
            WHERE Order_id = ? AND Is_completed_status = 0
            ORDER BY FIELD(Status_name, 'Receive order', 'Order completed', 'Shipped')
            LIMIT 1
        `;
        
        const [statusToUpdate] = await query<RowDataPacket[]>(findStatusQuery, [orderId]);

        if (!statusToUpdate) {
            return NextResponse.json({ 
                error: 'No status found to update',
                orderId: orderId
            }, { status: 400 });
        }

        // อัพเดทสถานะ
        const updateQuery = `
            UPDATE Status 
            SET Is_completed_status = 1, 
                Status_date = CURRENT_TIMESTAMP
            WHERE Status_id = ? 
            AND Order_id = ?
            AND Is_completed_status = 0
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