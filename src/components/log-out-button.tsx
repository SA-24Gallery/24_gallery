"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export const LogOutButton = () => {
// In your client-side component
    const handleSignOut = async () => {
        try {
            // Call the API route to close the pool
            const response = await fetch('/api/close-pool', { method: 'POST' });
            if (!response.ok) {
                throw new Error('Failed to close database pool');
            }

            // Then sign out
            await signOut({
                callbackUrl: "/",
                redirect: true,
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
