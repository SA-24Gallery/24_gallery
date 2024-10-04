"use client";

import * as React from "react";
import Link from "next/link";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import NotiBell from "./noti-bell";
import ProfileIcon from "./profile-icon";
import { Session } from "next-auth";

const LeftItem = ({ session }: { session: Session | null }) => {
    return (
        <>
            {session?.user?.role === "A" ? (
                <>
                    <NavigationMenuItem>
                        <NavigationMenuLink href="/">
                            <div className={"font-medium text-lg"}>MANAGE ORDERS</div>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                </>
            ) : (
                <>
                    <NavigationMenuItem>
                        <NavigationMenuLink href="/">
                            <div className={"font-medium text-lg"}>ORDER</div>
                        </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                        <NavigationMenuLink href="/">
                            <div className={"font-medium text-lg"}>MY ORDER</div>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                </>
            )}
        </>
    );
};

const RightItem = ({ session }: { session: Session | null }) => {
    return (
        <>
            <NavigationMenuItem>
                <NavigationMenuLink href="/">
                    <div className={"font-medium text-lg"}>CART</div>
                </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
                {session ? (
                    <div className="flex flex-col gap-5 items-center sm:flex-row w-fit hi">
                        <NotiBell />
                        <ProfileIcon email ={session.user?.email? (session.user?.email):("")} />
                    </div>
                ) : (
                    <NavigationMenuLink href="/login/">
                        <div className={"font-medium text-lg"}>LOG IN</div>
                    </NavigationMenuLink>
                )}
            </NavigationMenuItem>
        </>
    );
};

export function NavBar({ session }: { session: Session | null }) {
    return (
        <div className={"flex justify-between items-center w-auto px-16 h-[72px]"}>
            <div className={"flex flex-row gap-5 items-center"}>
                <Link className={"font-bold text-lg"} href="/" passHref>
                    24GALLERY
                </Link>

                <div className={"bg-black h-2.5 w-2.5 rounded-lg hidden sm:flex"} />

                <NavigationMenu>
                    <NavigationMenuList className={"flex-row gap-5 hidden sm:flex"}>
                        <LeftItem session={session} />
                    </NavigationMenuList>
                </NavigationMenu>
            </div>

            <NavigationMenu>
                <NavigationMenuList className={"flex-row justify-end gap-5 hidden sm:flex"}>
                    <RightItem session={session} />
                </NavigationMenuList>
            </NavigationMenu>

            <Sheet>
                <SheetTrigger asChild>
                    <button className="sm:hidden">
                        <Menu size={24} />
                    </button>
                </SheetTrigger>

                <SheetContent className="w-1/3">
                    <NavigationMenu className="w-full">
                        <NavigationMenuList className="flex flex-col gap-4 mt-8">
                            <LeftItem session={session} />
                            <RightItem session={session} />
                        </NavigationMenuList>
                    </NavigationMenu>
                </SheetContent>
            </Sheet>
        </div>
    );
}
