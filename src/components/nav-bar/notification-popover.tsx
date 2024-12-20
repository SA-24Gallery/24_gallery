import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import NotificationBell from "@/components/nav-bar/notification-bell";
import { useEffect, useState } from "react";

interface Notification {
    Msg_id: number;
    Msg: string;
    Notified_date: string;
    Is_read: number;
}

export function NotificationPopover() {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notification');
            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }
            const data = await response.json();
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const unreadCount = notifications.filter(notification => notification.Is_read === 0).length;

    const markAllAsRead = async () => {
        try {
            // อัปเดตสถานะการอ่านใน Database
            const response = await fetch('/api/notification/read-all', {
                method: 'PUT',
            });
            if (!response.ok) {
                throw new Error('Failed to update notifications as read');
            }
        } catch (error) {
            console.error('Failed to mark notifications as read:', error);
        }
    };

    return (
        <Popover
            onOpenChange={(open) => {
                if (open) {
                    markAllAsRead();
                } else {
                    fetchNotifications();
                }
            }}
        >
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-[35px] border-none bg-transparent">
                    <NotificationBell count={unreadCount} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0 m-0">
                <div className="grid">
                    {notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <div
                                key={notification.Msg_id}
                                className={`flex items-start gap-3 p-4 border-b last:border-none ${
                                    notification.Is_read === 1
                                        ? 'bg-gray-100 text-gray-500'
                                        : 'bg-white text-black'
                                }`}
                            >
                                {notification.Is_read === 0 && (
                                    <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
                                )}
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium">
                                            {new Date(notification.Notified_date).toLocaleString('en-US', {
                                                dateStyle: 'medium',
                                                timeStyle: 'short',
                                            })}
                                        </span>
                                    </div>
                                    <div className="text-base">{notification.Msg}</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center text-gray-500">No notifications available</div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
