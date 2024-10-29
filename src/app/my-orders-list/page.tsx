import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NavBar } from "@/components/nav-bar/nav-bar";
import MyOrdersList from "@/components/my-orders-list";
import { notFound } from "next/navigation";

export default async function MyOrdersListPage() {
  const session = await getServerSession(authOptions);


  if (!session || !session.user || session.user.role !== "U") {
    notFound();
  }

  return (
    <div style={{ backgroundColor: "#FFF7F9", minHeight: "100vh", paddingBottom: "60px" }}>
      <NavBar session={session} />
      <div className="flex flex-col items-center gap-12">
        <h1 className="text-center font-bold text-4xl h-full">
          My Orders
        </h1>
        <MyOrdersList />
      </div>
    </div>
  );
}
