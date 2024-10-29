import {
    Dot,
    LockOpen,
    type Icon as LucidIcon, CircleUserRound, Mail, Phone,
} from "lucide-react"

export type Icons = typeof LucidIcon;
import Image from 'next/image';

export const Icons = {
    dot: Dot,
    lock_open: LockOpen,
    circle_user_round: CircleUserRound,
    mail: Mail,
    phone: Phone,
    logo: ({ width = 100, height = 100, ...props }) => (
        <Image
            src="/images/icon.svg"
            alt="Logo"
            width={width}
            height={height}
            {...props}
        />
    ),
};