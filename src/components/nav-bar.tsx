"use client";

import * as React from "react";
import Link from "next/link";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";

export function NavBar() {
    return (
        <div className={"flex justify-between items-center w-auto px-16 py-6"}>

            <NavigationMenu>
                <NavigationMenuList className={"flex flex-row gap-5"}>

                    <NavigationMenuItem>
                        <Link href="/" legacyBehavior passHref>
                            <NavigationMenuLink>
                                <div className={"font-bold text-lg"}>
                                    24GALLERY
                                </div>
                            </NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>

                    <div className={"bg-black h-2.5 w-2.5 rounded-lg"}/>

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

                </NavigationMenuList>
            </NavigationMenu>


            <NavigationMenu>
                <NavigationMenuList className={"flex flex-row justify-end gap-5"}>
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
                        <Link href="/log-in/" legacyBehavior passHref>
                            <NavigationMenuLink>
                                <div className={"font-medium text-lg"}>
                                    LOG IN
                                </div>
                            </NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>

                </NavigationMenuList>
            </NavigationMenu>
        </div>
    )
}


