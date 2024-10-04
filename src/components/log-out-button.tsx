"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export const LogOutButton = () => {
    return (
        <div className="flex flex-col w-fit h-fit items-center gap-[20px]">
            <Button onClick={() => signOut({ callbackUrl: "/" })} className="w-[198px] rounded-[20px] h-[52px] text-xl font-bold">
                Log out
            </Button>
        </div>
    );
};
