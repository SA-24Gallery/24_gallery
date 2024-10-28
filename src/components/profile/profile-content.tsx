"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { notFound, useRouter } from "next/navigation";

import { NavBar } from "@/components/nav-bar/nav-bar";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { LogOutButton } from "@/components/log-out-button";
import { EditDialog } from "./edit-dialog";

export default function ProfileContent({ params }: { params: { email: string } }) {
    const { data: session, update, status } = useSession();
    const router = useRouter();

    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneNumberError, setPhoneNumberError] = useState('');
    const [openPhoneDialog, setOpenPhoneDialog] = useState(false);
    const [isSavingPhone, setIsSavingPhone] = useState(false);

    const [name, setName] = useState('');
    const [nameError, setNameError] = useState('');
    const [openNameDialog, setOpenNameDialog] = useState(false);
    const [isSavingName, setIsSavingName] = useState(false);

    useEffect(() => {
        if (session && session.user) {
            setPhoneNumber(session.user.phone_number || '');
            setName(session.user.name || '');
        }
    }, [session]);

    if (status === "loading") {
        return <p></p>;
    }

    if (!session || session?.user?.email !== decodeURIComponent(params.email)) {
        notFound();
    }

    const handleSavePhone = async (newPhoneNumber: string) => {
        setPhoneNumberError('');
        setIsSavingPhone(true);

        try {
            const response = await fetch('/api/update-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: newPhoneNumber }),
            });

            const result = await response.json();

            if (!response.ok) {
                setPhoneNumberError(result.error || 'ไม่สามารถอัปเดตหมายเลขโทรศัพท์ได้');
            } else {
                await update({
                    user: {
                        ...session.user,
                        phone_number: newPhoneNumber,
                    },
                });
                setPhoneNumber(newPhoneNumber);
                setOpenPhoneDialog(false);
                router.refresh();
            }
        } catch (error) {
            console.error('Error updating phone number:', error);
            setPhoneNumberError('เกิดข้อผิดพลาดในการอัปเดตหมายเลขโทรศัพท์ของคุณ');
        } finally {
            setIsSavingPhone(false);
        }
    };

    const handleSaveName = async (newName: string) => {
        setNameError('');
        setIsSavingName(true);

        try {
            const response = await fetch('/api/update-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName }),
            });

            const result = await response.json();

            if (!response.ok) {
                setNameError(result.error || 'ไม่สามารถอัปเดตชื่อได้');
            } else {
                await update({
                    user: {
                        ...session.user,
                        name: newName,
                    },
                });
                setName(newName);
                setOpenNameDialog(false);
                router.refresh();
            }
        } catch (error) {
            console.error('Error updating name:', error);
            setNameError('เกิดข้อผิดพลาดในการอัปเดตชื่อของคุณ');
        } finally {
            setIsSavingName(false);
        }
    };

    const handleMyOrdersClick = () => {
        router.push("/my-orders-list");  
    };

    return (
        <div style={{ backgroundColor: "#FFF7F9", minHeight: "100vh", paddingBottom: "160px" }}>
            <NavBar session={session} />
            <div className="flex flex-col items-center gap-12">
                <h1 className="text-center font-bold text-4xl h-full">
                    Profile
                </h1>
                <div className="flex flex-col items-center bg-white gap-7 w-[900px] h-[667px] rounded-[20px] justify-center">
                    <div className="flex flex-col w-fit h-fit items-center gap-[50px]">
                        <div className="flex flex-col gap-[20px] items-center">
                            <Icons.circle_user_round className="h-[200px] w-[200px] stroke-[0.12px]" />
                            <div className="flex flex-col gap-[20px] items-end">

                                <div className="flex flex-row gap-[10px] items-center">
                                    <h1 className="font-medium text-3xl text-center">
                                        K.{name}
                                    </h1>

                                    <EditDialog
                                        label="Name"
                                        value={name}
                                        isOpen={openNameDialog}
                                        onOpenChange={setOpenNameDialog}
                                        onSave={handleSaveName}
                                        isSaving={isSavingName}
                                        error={nameError}
                                        setError={setNameError}
                                    />
                                </div>

                                <div className="flex flex-row gap-[10px] items-center">
                                    <Icons.mail className="h-[30px] w-[30px] stroke-[1.7px]" />
                                    <p className="text-2xl text-center">
                                        {session.user.email}
                                    </p>
                                    <Button
                                        className="w-[75px] rounded-[20px] h-[33px] bg-[#D9D9D9] font-normal text-lg text-center text-black hover:text-white"
                                        onClick={() => navigator.clipboard.writeText(session?.user?.email || "")}
                                    >
                                        copy
                                    </Button>
                                </div>

                                <div className="flex flex-row gap-[10px] items-center">
                                    <Icons.phone className="h-[30px] w-[30px] stroke-[1.7px]" />
                                    <p className=" text-2xl text-center">
                                        {phoneNumber}
                                    </p>

                                    <EditDialog
                                        label="Phone Number"
                                        value={phoneNumber}
                                        isOpen={openPhoneDialog}
                                        onOpenChange={setOpenPhoneDialog}
                                        onSave={handleSavePhone}
                                        isSaving={isSavingPhone}
                                        error={phoneNumberError}
                                        setError={setPhoneNumberError}
                                        validationPattern="^0[0-9]{9}$"
                                        validationTitle="Phone number must be 10 digits and start with 0"
                                        inputType="tel"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col w-fit h-fit items-center gap-[20px]">
                            <Button className="w-[198px] rounded-[20px] h-[52px] text-xl font-bold" onClick={handleMyOrdersClick}>
                                My order
                            </Button>
                            <LogOutButton />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
