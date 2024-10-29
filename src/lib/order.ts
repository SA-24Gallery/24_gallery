import { query } from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

async function getNextStatusId(): Promise<string> {
    const prefix = 'stt';
    const numberLength = 5;

    const result = await query<RowDataPacket[]>(
        `SELECT status_id FROM Status
     ORDER BY CAST(SUBSTRING(status_id, ${prefix.length + 1}) AS UNSIGNED) DESC LIMIT 1`
    );

    let nextStatusId = '';

    if (result.length > 0) {
        const lastStatusId = result[0].status_id;
        const numberPart = lastStatusId.substring(prefix.length);
        const nextNumber = parseInt(numberPart, 10) + 1;
        const nextNumberPadded = nextNumber.toString().padStart(numberLength, '0');
        nextStatusId = prefix + nextNumberPadded;
    } else {
        nextStatusId = prefix + '00001';
    }

    return nextStatusId;
}

async function createOrderStatuses(orderId: string): Promise<void> {
    const baseStatusId = await getNextStatusId();
    const baseNumber = parseInt(baseStatusId.substring(3));

    const statuses = [
        {
            name: 'Receive order',
            isCompleted: 0,
            date: null
        },
        {
            name: 'Order completed',
            isCompleted: 0,
            date: null
        },
        {
            name: 'Shipped',
            isCompleted: 0,
            date: null
        }
    ];

    const insertStatusSql = `
    INSERT INTO Status (
      status_id,
      Status_name, 
      Status_date,
      Order_id,
      Is_completed_status
    ) VALUES (?, ?, ?, ?, ?)
  `;

    for (let i = 0; i < statuses.length; i++) {
        const status = statuses[i];
        const statusNumber = (baseNumber + i).toString().padStart(5, '0');
        const statusId = `stt${statusNumber}`;

        await query<ResultSetHeader>(
            insertStatusSql,
            [
                statusId,
                status.name,
                status.date,
                orderId,
                status.isCompleted
            ]
        );
    }
}

async function getNextOrderId(): Promise<string> {
    const prefix = 'ord';
    const numberLength = 5;

    const result = await query<RowDataPacket[]>(
        `SELECT order_id FROM orders
     ORDER BY CAST(SUBSTRING(order_id, ${prefix.length + 1}) AS UNSIGNED) DESC LIMIT 1`
    );

    let nextOrderId = '';

    if (result.length > 0) {
        const lastOrderId = result[0].order_id;
        const numberPart = lastOrderId.substring(prefix.length);
        const nextNumber = parseInt(numberPart, 10) + 1;
        const nextNumberPadded = nextNumber.toString().padStart(numberLength, '0');
        nextOrderId = prefix + nextNumberPadded;
    } else {
        nextOrderId = prefix + '00001';
    }

    return nextOrderId;
}

export async function createNewOrder(email: string): Promise<string> {
    const orderId = await getNextOrderId();

    const insertOrderSql = `
    INSERT INTO orders (
      order_id,  
      order_date,
      email,
      shipping_option,
      payment_status,
      payment_deadline
    ) VALUES (?, null, ?, null, 'N', null)
  `;

    await query<ResultSetHeader>(
        insertOrderSql,
        [orderId, email]
    );

    await createOrderStatuses(orderId);

    return orderId;
}