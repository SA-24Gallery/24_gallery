import { NavBar } from "@/components/nav-bar/nav-bar";
import { LoginForm } from "../../components/login-form";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { redirect } from "next/navigation";

export default async function LoginPage() {
    const session = await getServerSession(authOptions);

    if (session) {
        redirect('/');
    }

    return (
        <div style={{ backgroundColor: "#FFF7F9", minHeight: "100vh" }}>
            <NavBar session={session} />
            <div className="flex flex-col items-center gap-12">
                <h1 className="text-center font-bold text-4xl h-full">
                    Hello Again!
                </h1>
                <LoginForm />
            </div>
        </div>
    );
}