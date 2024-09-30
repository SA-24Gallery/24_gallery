import {NavBar} from "@/components/nav-bar";
import Image from "next/image";

export default function Home() {
  return (
      <div>
          <NavBar />
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