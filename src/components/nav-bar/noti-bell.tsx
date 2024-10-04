import { Bell } from "lucide-react"

interface NotificationBellProps {
  count?: number
}

export default function NotiBell({ count = 999 }: NotificationBellProps) {
  return (
    <div className="inline-flex items-center justify-center">
      <div className="relative">
        <Bell className="w-[35px] h-[35px] stroke-[1px] stroke-black" />
        {count > 0 && (
          <span className="absolute -top-0 -right-1 flex items-center justify-center w-[23px] h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </div>
    </div>
  )
}