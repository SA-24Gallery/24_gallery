"use client";

import * as React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "./ui/button";
import { Icons } from "./icons";

const LeftItem = ({ session }: { session: any }) => {
    return (
        <>
            {session && session.user.role === "A" ? (
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

const RightItem = ({ session }: { session: any }) => {
    return (
        <>
            <NavigationMenuItem>
                <NavigationMenuLink href="/">
                    <div className={"font-medium text-lg"}>CART</div>
                </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
                {session ? (
                    <div className="flex flex-col gap-4 items-center sm:flex-row">
                        <Link href={`/profile/${session.user?.email}`} passHref>
                            <Button
                                variant="outline"
                                size="icon"
                                className="hidden sm:flex border-none w-[40px] h-[40px] bg-transparent active:ring-0 hover:bg-transparent"
                            >
                                <Icons.circle_user_round className="h-full w-full stroke-[1px]" />
                            </Button>
                        </Link>

                        <Link href={`/profile/${session.user?.email}`} passHref>
                            <div className={"font-medium text-lg sm:hidden"}>Profile</div>
                        </Link>

                        <div onClick={() => signOut({ callbackUrl: "/" })}>
                            <div className={"font-medium text-lg cursor-pointer"}>LOG OUT</div>
                        </div>
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

export function NavBar({ session }: { session: any }) {
    return (
        <div className={"flex justify-between items-center w-auto px-16 py-6"}>
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
