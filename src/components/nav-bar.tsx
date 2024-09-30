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

const LeftItem = () => (
    <>
        <NavigationMenuItem>
            <Link href="/" legacyBehavior passHref>
                <NavigationMenuLink>
                    <div className={"font-medium text-lg"}>
                        ORDER
                    </div>
                </NavigationMenuLink>
            </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
            <Link href="/" legacyBehavior passHref>
                <NavigationMenuLink>
                    <div className={"font-medium text-lg"}>
                        CONTACT US
                    </div>
                </NavigationMenuLink>
            </Link>
        </NavigationMenuItem>
    </>
);

const RightItem = () => (
    <>

        <NavigationMenuItem>
            <Link href="/" legacyBehavior passHref>
                <NavigationMenuLink>
                    <div className={"font-medium text-lg"}>
                        CART
                    </div>
                </NavigationMenuLink>
            </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
            <Link href="/login/" legacyBehavior passHref>
                <NavigationMenuLink>
                    <div className={"font-medium text-lg"}>
                        LOG IN
                    </div>
                </NavigationMenuLink>
            </Link>
        </NavigationMenuItem>
    </>
);

export function NavBar() {
    return (
        <div className={"flex justify-between items-center w-auto px-16 py-6"}>

            <div className={"flex flex-row gap-5 items-center"}>
                <Link className={"font-bold text-lg"} href={"/"}>
                    24GALLERY
                </Link>

                <div className={"bg-black h-2.5 w-2.5 rounded-lg hidden sm:flex"}/>

                <NavigationMenu>
                    <NavigationMenuList className={"flex-row gap-5 hidden sm:flex"}>
                        <LeftItem />
                    </NavigationMenuList>
                </NavigationMenu>

            </div>


            <NavigationMenu>
                <NavigationMenuList className={"flex-row justify-end gap-5 hidden sm:flex"}>
                    <RightItem />
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
                            <LeftItem />
                            <RightItem />
                        </NavigationMenuList>
                    </NavigationMenu>
                </SheetContent>
            </Sheet>
        </div>
    )
}


