import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { query } from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
    Email: string;
    Password: string;
    Is_active_user: boolean;
    Role: string;
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

                if (!user.Is_active_user) {
                    await query(
                        'UPDATE users SET Is_active_user = ? WHERE Email = ?',
                        [true, user.Email]
                    );
                }

                return {
                    id: user.Email,
                    email: user.Email,
                    role: user.Role,
                };
            }
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: 12 * 60 * 60,
    },

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
