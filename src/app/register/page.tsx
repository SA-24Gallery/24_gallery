import { NavBar } from "@/components/nav-bar/nav-bar";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { RegisterForm } from "../../components/register-form";

export default async function RegisterPage() {
    const session = await getServerSession(authOptions);

    return (
        <div style={{ backgroundColor: "#FFF7F9", minHeight: "100vh", paddingBottom: "60px" }}>
            <NavBar session={session} />
            <div className="flex flex-col items-center gap-12">
                <h1 className="text-center font-bold text-4xl h-full">
                    Register
                </h1>

                <RegisterForm />

            </div>
        </div>
    );
}