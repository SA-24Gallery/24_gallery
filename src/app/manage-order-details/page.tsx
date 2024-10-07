import { NavBar } from '@/components/nav-bar/nav-bar'; 
import { authOptions } from '@/lib/auth';
import { getServerSession } from "next-auth";
import ManageOrderDetails from "@/components/manage-order-details";

export default async function OrderPage() {

  const session = await getServerSession(authOptions);
  return (
      <div style={{ backgroundColor: "#FFF7F9", minHeight: "100vh", paddingBottom: "60px" }}>
          <NavBar session={session} />

          <div className="flex flex-col items-center gap-12">
              <h1 className="text-center font-bold text-4xl h-full">
                  Manage Order Details
              </h1>
              <ManageOrderDetails />
          </div>
      </div>
  );
}
