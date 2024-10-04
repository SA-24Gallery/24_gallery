"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RegisterForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [name, setName] = useState('');

    const [emailError, setEmailError] = useState('');
    const [nameError, setNameError] = useState('');
    const [phoneNumberError, setPhoneNumberError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError('');
        setPasswordError('');
        setConfirmPasswordError('');
        setNameError('');
        setPhoneNumberError('');
        setIsLoading(true);

        if (confirmPassword !== password) {
            setConfirmPasswordError('*' + "Passwords do not match.");
            setIsLoading(false);
            return;
        }

        const response = await fetch('/api/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, phone_number: phoneNumber, password }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (!response.ok) {
            if (result.error.includes("Email")) {
                setEmailError('*' + result.error);
            }
            setIsLoading(false);
        } else {
            router.push('/register-complete');
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
                <div className="flex flex-col items-center bg-white px-36 py-16 gap-7 w-[814px] h-fit rounded-[20px]">

                    <div className="flex flex-col gap-4 w-full h-fit">
                        <div className='flex flex-row gap-4 items-end'>
                            <h1 className="font-bold text-2xl">Name</h1>
                            <p className="text-lg" style={{ color: "#FF0000" }}>{nameError}</p>
                        </div>
                        <Input
                            type="text"
                            placeholder="Enter your name"
                            className="w-full rounded-md border-black text-base h-11 relative"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-4 w-full h-fit">
                        <div className='flex flex-row gap-4 items-end'>
                            <h1 className="font-bold text-2xl">Email</h1>
                            <p className="text-lg" style={{ color: "#FF0000" }}>{emailError}</p>
                        </div>
                        <Input
                            type="email"
                            placeholder="Enter your email"
                            className="relative w-full rounded-md border-black text-base h-11"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-4 w-full h-fit">
                        <div className='flex flex-row gap-4 items-end'>
                            <h1 className="font-bold text-2xl">Phone number</h1>
                            <p className="text-lg" style={{ color: "#FF0000" }}>{phoneNumberError}</p>
                        </div>

                        <Input
                            type="tel"
                            placeholder="Enter your phone number"
                            className="relative w-full rounded-md border-black text-base h-11"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            pattern="^0[0-9]{9}$"
                            title={"Phone number must be 10 digits and start with 0"}
                            required
                        />

                    </div>

                    <div className="flex flex-col gap-4 w-full h-fit">
                        <div className='flex flex-row gap-4 items-end'>
                            <h1 className="font-bold text-2xl">Password</h1>
                            <p className="text-lg" style={{ color: "#FF0000" }}>{passwordError}</p>
                        </div>
                        <Input
                            type="password"
                            placeholder="Enter your password"
                            className="relative w-full rounded-md border-black text-base h-11"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$"
                            title="Password must be at least 8 characters long, include uppercase, lowercase, and a number."
                            required
                        />

                    </div>

                    <div className="flex flex-col gap-4 w-full h-fit">
                        <div className='flex flex-row gap-[15px] items-end'>
                            <h1 className="font-bold text-2xl w-fit">Confirm password</h1>
                            <p className="" style={{ color: "#FF0000" }}>{confirmPasswordError}</p>
                        </div>
                        <Input
                            type="password"
                            placeholder="Confirm your password"
                            className="relative w-full rounded-md border-black text-base h-11"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" disabled={isLoading}
                        className="w-72 rounded-3xl font-bold text-center text-xl">
                        {isLoading ? "Registering..." : "Register"}
                    </Button>

                </div>
            </form>
        </>
    );
}
