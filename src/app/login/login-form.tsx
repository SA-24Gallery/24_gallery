"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isLoading, setIsLoading] = useState(false);  // เพิ่ม isLoading state
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError('');
        setPasswordError('');
        setIsLoading(true);  // ตั้งค่า isLoading เป็น true เมื่อเริ่มการเข้าสู่ระบบ

        if (!email) {
            setEmailError("Email is required");
            setIsLoading(false);
            return;
        }
        if (!password) {
            setPasswordError("Password is required");
            setIsLoading(false);
            return;
        }

        const result = await signIn('credentials', {
            redirect: false,
            email,
            password,
        });

        if (result?.error) {
            if (result.error.includes("Email")) {
                setEmailError('*' + result.error);
            } else if (result.error.includes("Password")) {
                setPasswordError('*' + result.error);
            }
            setIsLoading(false);  // ตั้งค่า isLoading เป็น false เมื่อมี error
        } else {
            router.push('/');
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
                <div className="flex flex-col items-center bg-white px-36 py-16 gap-7 w-[814px] h-[436px] rounded-[20px]">

                    <div className="flex flex-col gap-4 w-full h-fit">
                        <div className='flex flex-row gap-4 items-end'>
                            <h1 className="font-bold text-2xl">Email</h1>
                            <p className="text-lg" style={{ color: "#FF0000" }}>{emailError}</p>
                        </div>
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Icons.circle_user_round className="h-7 w-7 stroke-[1px] text-black" />
                            </div>
                            <Input
                                type="email"
                                placeholder="e.g. username@gmail.com"
                                className="pl-11 py-2 w-full rounded-md border-black text-base h-11"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 w-full h-fit">
                        <div className='flex flex-row gap-4 items-end'>
                            <h1 className="font-bold text-2xl">Password</h1>
                            <p className="text-lg" style={{ color: "#FF0000" }}>{passwordError}</p>
                        </div>
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Icons.lock_open className="h-7 w-7 stroke-[1px] border-black transform scale-x-[-1]" />
                            </div>
                            <Input
                                type="password"
                                placeholder="Enter your password"
                                className="pl-11 py-2 w-full rounded-md border-black text-base h-11"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex justify-end w-full h-fit gap-3 font-medium text-lg">
                            <div>Not a member?</div>
                            <Link href="/sign-up" style={{ color: "#B7828E" }}>Register now</Link>
                        </div>

                    </div>

                    <Button type="submit" disabled={isLoading} className="w-72 rounded-3xl font-bold text-center text-xl">
                        {isLoading ? "Logging in..." : "Log in"}  {/* เปลี่ยนข้อความในปุ่ม */}
                    </Button>

                </div>
            </form>
        </>
    );
}
