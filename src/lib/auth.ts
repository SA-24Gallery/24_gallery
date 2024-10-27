import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { query } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { JWT } from "next-auth/jwt";

interface UserRow extends RowDataPacket {
    Email: string;
    Password: string;
    Role: string;
    Phone_number: string;
    User_name: string;
}

// กำหนด interface สำหรับ JWT token
interface ExtendedJWT extends JWT {
    role?: string;
    phone_number?: string;
    exp?: number;
    iat?: number;
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const users = await query<UserRow[]>(
                    'SELECT * FROM users WHERE Email = ?',
                    [credentials.email]
                );

                if (users.length === 0) {
                    throw new Error("Email not found");
                }

                const user = users[0];
                const encryptedPassword = user.Password;

                const passwordMatch = await compare(credentials.password, encryptedPassword);

                if (!passwordMatch) {
                    throw new Error("Password is incorrect");
                }

                return {
                    id: user.Email,
                    email: user.Email,
                    role: user.Role,
                    phone_number: user.Phone_number,
                    name: user.User_name,
                };
            }
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: 6 * 60 * 60, // 6 hours in seconds
    },
    jwt: {
        maxAge: 6 * 60 * 60, // 6 hours in seconds
    },
    pages: {
        signIn: '/login',
        signOut: '/login',
    },

    callbacks: {
        async jwt({ token, user, trigger, session }): Promise<ExtendedJWT> {
            const extendedToken = token as ExtendedJWT;

            if (user) {
                extendedToken.role = user.role;
                extendedToken.phone_number = user.phone_number;
                extendedToken.iat = Math.floor(Date.now() / 1000);
                extendedToken.exp = Math.floor(Date.now() / 1000) + (6 * 60 * 60);
            }

            if (trigger === "update" && session) {
                return {
                    ...extendedToken,
                    ...session.user,
                };
            }

            // เช็คเวลาหมดอายุของ token
            if (extendedToken.exp && Date.now() >= extendedToken.exp * 1000) {
                throw new Error('Token expired');
            }

            return extendedToken;
        },
        async session({ session, token }) {
            const extendedToken = token as ExtendedJWT;

            if (session.user) {
                session.user.role = extendedToken.role;
                session.user.phone_number = extendedToken.phone_number;
                session.user.name = extendedToken.name;

                if (extendedToken.exp) {
                    session.expires = new Date(extendedToken.exp * 1000).toISOString();
                }
            }
            return session;
        }
    },
};