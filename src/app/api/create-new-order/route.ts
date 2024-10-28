import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import { createNewOrder } from '@/lib/order';

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const email = session.user.email;
        if (!email) {
            return NextResponse.json({ message: 'User email not found' }, { status: 400 });
        }

        const orderId = await createNewOrder(email);

        return NextResponse.json(
            {
                success: true,
                orderId: orderId,
                message: 'New order created successfully'
            },
            { status: 201 }
        );

    } catch (error: any) {
        console.error('Error creating new order:', error);
        return NextResponse.json(
            { error: "Error creating new order", message: error.message },
            { status: 500 }
        );
    }
}