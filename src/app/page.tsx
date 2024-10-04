import { NavBar } from "@/components/nav-bar/nav-bar";
import { getServerSession } from "next-auth";
import Image from "next/image";
import { authOptions } from "@/lib/auth";

export default async function Home() {
    const session = await getServerSession(authOptions);
    return (
        <div>
            <NavBar session={session} />
            <Image
                src="/images/home.png"
                alt="Poster"
                layout="responsive"
                width={1920}
                height={818.67}
            />

        </div>
    );
}