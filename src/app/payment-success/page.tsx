import { NavBar } from "@/components/nav-bar/nav-bar";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { PaymentSuccess } from "@/components/payment-success";
import { redirect } from 'next/navigation';

export default async function RegisterPage() {
    const session = await getServerSession(authOptions);
    
    if (session) {
        redirect('/');
    }

    return (
        <div style={{ backgroundColor: "#FFF7F9", minHeight: "100vh", paddingBottom: "60px" }}>
            <NavBar session={session} />
            <div className="flex flex-col items-center gap-12 pt-[100px]">
                <PaymentSuccess/>
            </div>
        </div>
    );
}