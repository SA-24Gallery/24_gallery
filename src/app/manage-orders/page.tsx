import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NavBar } from "@/components/nav-bar/nav-bar";
import ManageOrders from "@/components/manage-orders";
import { notFound } from "next/navigation";

export default async function MyOrdersPageComponent() {
  const session = await getServerSession(authOptions);

  // Safely check if session exists and if session.user exists
  if (!session || !session.user || session.user.role !== "A") {
    notFound(); // Redirect to 404 page if the user is not an admin
  }

  return (
    <div style={{ backgroundColor: "#FFF7F9", minHeight: "100vh", paddingBottom: "60px" }}>
      <NavBar session={session} />
      <div className="flex flex-col items-center gap-12">
        <h1 className="text-center font-bold text-4xl h-full">
          Manage Orders
        </h1>
        <ManageOrders />
      </div>
    </div>
  );
}