import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { name, phoneNumber } = await request.json();

    if (!name && !phoneNumber) {
      return NextResponse.json({ error: "No data provided to update" }, { status: 400 });
    }

    let sql = 'UPDATE users SET';
    const params = [];
    const updates = [];

    if (name) {
      updates.push(' User_name = ?');
      params.push(name);
    }

    if (phoneNumber) {
      updates.push(' Phone_number = ?');
      params.push(phoneNumber);
    }

    sql += updates.join(',');
    sql += ' WHERE Email = ?';
    params.push(session.user.email);

    await query(sql, params);

    return NextResponse.json({ success: true, updatedFields: { name, phoneNumber } });
  } catch (error) {
    console.error('Error updating user data:', error);
    return NextResponse.json({ error: "An error occurred while updating user data" }, { status: 500 });
  }
}
