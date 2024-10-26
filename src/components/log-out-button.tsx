"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { closePool } from '@/lib/db'; // import function closePool

export const LogOutButton = () => {
    const handleSignOut = async () => {
        try {
            // Disconnect from database first
            await closePool();

            // Then sign out
            await signOut({
                callbackUrl: "/",
                redirect: true
            });
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <div className="flex flex-col w-fit h-fit items-center gap-[20px]">
            <Button
                onClick={handleSignOut}
                className="w-[198px] rounded-[20px] h-[52px] text-xl font-bold"
            >
                Log out
            </Button>
        </div>
    );
};