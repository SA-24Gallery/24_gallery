"use client";

import ProfileContent from "@/components/profile/profile-content";
import { SessionProvider } from "next-auth/react";


export default function ProfilePage({ params }: { params: { email: string } }) {
    return (
        <SessionProvider>
            <ProfileContent params={params} />
        </SessionProvider>
    );
}

