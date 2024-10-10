import { NavBar } from '@/components/nav-bar/nav-bar'; 
import { authOptions } from '@/lib/auth';
import { getServerSession } from "next-auth";
import MyCartForm from "@/components/my-cart-form";

export default async function MyCart() {
  const session = await getServerSession(authOptions);

  return (
      <div style={{ backgroundColor: "#FFF7F9", minHeight: "100vh", paddingBottom: "60px" }}>
          <NavBar session={session} />
          <div className="flex flex-col items-center gap-12">
              <h1 className="text-center font-bold text-4xl h-full">
                  My Cart
              </h1>
              <MyCartForm/>
          </div>
      </div>
  );
}
