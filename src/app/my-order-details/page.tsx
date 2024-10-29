import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NavBar } from "@/components/nav-bar/nav-bar";
import MyOrdersDetailsPage from "@/components/my-order-details"; 


export default async function MyOrderDetailsPage() {
    const session = await getServerSession(authOptions);

    return (
            <div style={{ backgroundColor: "#FFF7F9", minHeight: "100vh", paddingBottom: "60px" }}>
                <NavBar session={session} />
                <div className="flex flex-col items-center gap-12">
                    <h1 className="text-center font-bold text-4xl h-full">
                        My Order
                    </h1>
                    <MyOrdersDetailsPage/>
                </div>
            </div>
        );
    
}

