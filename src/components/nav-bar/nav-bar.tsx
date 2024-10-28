"use client";

import * as React from "react";
import Link from "next/link";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet";
import {Menu} from "lucide-react";
import ProfileIcon from "./profile-icon";
import {Session} from "next-auth";
import {NotificationPopover} from "@/components/nav-bar/noti";

const LeftItem = ({session}: { session: Session | null }) => {
    return (
        <>
            {session?.user?.role === "A" ? (
                <>
                    <NavigationMenuItem>
                        <NavigationMenuLink href="/manage-orders/">
                            <div className={"font-medium text-lg"}>MANAGE ORDERS</div>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                </>
            ) : (
                <>
                    <NavigationMenuItem>
                        <NavigationMenuLink href="/order/">
                            <div className={"font-medium text-lg"}>ORDER</div>
                        </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem> 
                        <NavigationMenuLink href="/my-orders-list/"> 
                            <div className={"font-medium text-lg"}>MY ORDER</div>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                </>
            )}
        </>
    );
};

const RightItem = ({session}: { session: Session | null }) => {
    return (
        <>
            {session ? (
                <>
                    <NavigationMenuItem>
                        <div className="flex flex-col gap-5 items-center sm:flex-row w-fit">
                            {session.user?.role == 'A'? (
                                <></>
                            ):(
                                <NavigationMenuLink href="/my-cart/">
                                    <div className={"font-medium text-lg"}>CART</div>
                                </NavigationMenuLink>
                            )}
                            <NotificationPopover/>
                            <ProfileIcon email={session.user?.email ? (session.user?.email) : ("")}/>
                        </div>
                    </NavigationMenuItem>
                </>
            ) : (
                <NavigationMenuItem className={"flex flex-col gap-5 items-center sm:flex-row w-fit"}>
                    <NavigationMenuLink href="/login/">
                        <div className={"font-medium text-lg"}>LOG IN</div>
                    </NavigationMenuLink>

                    <NavigationMenuLink href="/register/">
                        <div className={"font-medium text-lg"}>REGISTER</div>
                    </NavigationMenuLink>

                </NavigationMenuItem>



            )}
        </>
    );
};

export function NavBar({session}: { session: Session | null }) {
    return (
        <div className={"flex justify-between items-center w-auto px-16 h-[72px]"}>
            <div className={"flex flex-row gap-5 items-center"}>
                <Link className={"font-bold text-lg"} href="/" passHref>
                    24GALLERY
                </Link>

                <div className={"bg-black h-2.5 w-2.5 rounded-lg hidden sm:flex"}/>

                <NavigationMenu>
                    <NavigationMenuList className={"flex-row gap-5 hidden sm:flex"}>
                        <LeftItem session={session}/>
                    </NavigationMenuList>
                </NavigationMenu>
            </div>

            <NavigationMenu>
                <NavigationMenuList className={"flex-row justify-end gap-5 hidden sm:flex"}>
                    <RightItem session={session}/>
                </NavigationMenuList>
            </NavigationMenu>

            <Sheet>
                <SheetTrigger asChild>
                    <button className="sm:hidden">
                        <Menu size={24}/>
                    </button>
                </SheetTrigger>

                <SheetContent className="w-1/3">
                    <NavigationMenu className="w-full">
                        <NavigationMenuList className="flex flex-col gap-4 mt-8">
                            <LeftItem session={session}/>
                            <RightItem session={session}/>
                        </NavigationMenuList>
                    </NavigationMenu>
                </SheetContent>
            </Sheet>
        </div>
    );
}
