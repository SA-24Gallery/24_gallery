import {NavBar} from "@/components/nav-bar";
import {Input} from "@/components/ui/input";
import {Icons} from "@/components/icons";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";


export default function LogIn() {
    return (
        <div style={{backgroundColor: "#FFF7F9", minHeight: "100vh", width: "100vw"}}>
            <NavBar/>

            <div className={"flex flex-col items-center gap-12"}>

                <h1 className="text-center font-bold text-4xl h-full">
                    Hello Again!
                </h1>

                <div className={"flex flex-col items-center gap-5"}>
                <div className={"flex flex-col items-center bg-white px-36 py-16 gap-7"}
                     style={{width: "814px", height: "436px", borderRadius: "20px"}}>

                    <div className={"flex flex-col gap-4 w-full h-fit"}>

                        <h1 className="font-bold text-2xl">
                            Your email
                        </h1>

                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Icons.circle_user_round className="h-6 w-6 text-black"/>
                            </div>
                            <Input
                                type="email"
                                placeholder="e.g. username@gmail.com"
                                className="pl-11 py-2 w-full rounded-md border-black text-base h-11"
                            />
                        </div>

                    </div>

                    <div className={"flex flex-col gap-4 w-full h-fit"}>

                        <h1 className="font-bold text-2xl">
                            Your password
                        </h1>

                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Icons.lock_open className="h-6 w-6 border-black"/>
                            </div>
                            <Input
                                type="password"
                                placeholder="e.g. 123456"
                                className="pl-11 py-2 w-full rounded-md border-black text-base h-11"
                            />
                        </div>

                        <div className={"flex justify-end w-full h-fit gap-3 font-medium"}>
                            <div>
                                Not a member?
                            </div>

                            <Link href={"/sign-up"} style={{color: "#B7828E"}}>
                                Register now
                            </Link>
                        </div>

                    </div>

                    <Button className={"w-72 rounded-3xl font-bold text-center text-xl"}>
                        Log in
                    </Button>

                </div>


                <Link href="/" legacyBehavior passHref>
                    <div className={"flex gap-3 justify-center items-center font-bold cursor-pointer"}>
                        <div>
                            Or continue with
                        </div>

                        <Image
                            src="/images/web_light_rd_na.svg"
                            alt="continue with google"
                            width={50}
                            height={50}
                        />
                    </div>
                </Link>

            </div>
        </div>
        </div>

    );
}