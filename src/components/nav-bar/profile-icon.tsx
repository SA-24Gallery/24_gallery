import { Link } from "@radix-ui/react-navigation-menu"
import { Button } from "../ui/button"
import { Icons } from "../icons"

export default function ProfileIcon({ email }: { email: string }) {
    return (
        <div>
            <Link href={`/profile/${email}`}>
                <Button
                    variant="outline"
                    size="icon"
                    className="hidden sm:flex border-none w-[40px] h-[40px] bg-transparent active:ring-0 hover:bg-transparent"
                >
                    <Icons.circle_user_round className="h-full w-full stroke-[1px]" />
                </Button>
            </Link>

            <Link href={`/profile/${email}`}>
                <div className={"font-medium text-lg sm:hidden"}>Profile</div>
            </Link>
        </div>
    )
}