import { NavBar } from "@/components/nav-bar/nav-bar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Payment from "@/components/payment";


export default async function PaymentPage() {
    const session = await getServerSession(authOptions);

    return (
        <div style={{ backgroundColor: "#FFF7F9", minHeight: "100vh", paddingBottom: "50px" }}>
            <NavBar session={session} />
            <div className="flex flex-col items-center gap-[40px]">
                <h1 className="text-center font-bold text-[32px] h-full">
                    Thai QR Payment
                </h1>
                <Payment/>
            </div>
        </div>
    );
}