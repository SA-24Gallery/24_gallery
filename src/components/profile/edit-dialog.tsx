"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EditDialogProps {
    label: string;
    value: string;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: (newValue: string) => Promise<void>;
    isSaving: boolean;
    error: string;
    setError: (error: string) => void;
    validationPattern?: string;
    validationTitle?: string;
    inputType?: string;
}

export const EditDialog: React.FC<EditDialogProps> = ({
    label,
    value,
    isOpen,
    onOpenChange,
    onSave,
    isSaving,
    error,
    setError,
    validationPattern,
    validationTitle,
    inputType = "text",
}) => {
    const [inputValue, setInputValue] = useState(value);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        await onSave(inputValue);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            onOpenChange(open);
            if (open) {
                setInputValue(value);
            }
        }}>
            <DialogTrigger asChild>
                <Button
                    className="w-[75px] rounded-[20px] h-[33px] bg-[#D9D9D9] font-normal text-lg text-center text-black hover:text-white"
                >
                    edit
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit {label}</DialogTitle>
                    <DialogDescription>
                        Make changes to your {label.toLowerCase()} here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2 w-full h-fit">
                        <div className='flex flex-row gap-4 items-end'>
                            <p className="font-medium">{label}</p>
                        </div>

                        <Input
                            type={inputType}
                            placeholder={`Enter your ${label.toLowerCase()}`}
                            className="relative w-full rounded-md text-base h-11"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            pattern={validationPattern}
                            title={validationTitle}
                            required
                        />
                    </div>

                    {error && <p className="text-red-500">{error}</p>}

                    <DialogFooter>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Saving changes' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
