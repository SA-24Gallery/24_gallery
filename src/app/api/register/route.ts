import bcrypt from 'bcryptjs';
import { query } from "@/lib/db";
import { NextResponse } from 'next/server';
import { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
    try {
        const { name, email, phone_number, password } = await request.json();

        if (!name || !email || !phone_number || !password) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        const users = await query<RowDataPacket[]>('SELECT COUNT(*) as count FROM Users WHERE Email = ?', [email]);

        if (users[0].count > 0) {
            return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
        }

        const encryptPassword = await bcrypt.hash(password, 10);

        const sql = 'INSERT INTO Users (Email, Phone_Number, User_name, Password, Role) VALUES (?, ?, ?, ?, "U");';
        await query(sql, [email, phone_number, name, encryptPassword]);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error registering user:', error);
        return NextResponse.json({ error: "An error occurred during registration" }, { status: 500 });
    }
}
