import {Input} from "@/components/ui/input"
import {Icons} from "@/components/icons";

export default function EmailInput() {
    return (
        <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Icons.circle_user_round className="h-6 w-6 text-gray-400"/>
            </div>
            <Input
                type="email"
                placeholder="e.g. username@gmail.com"
                className="pl-11 py-2 w-full rounded-md border-gray-300 text-base h-11"
            />
        </div>
    )
}