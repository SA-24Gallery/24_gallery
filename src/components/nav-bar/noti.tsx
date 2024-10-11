import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import NotiBell from "@/components/nav-bar/noti-bell";
import { useEffect, useState } from "react";

interface Notification {
    Msg_id: number;
    Msg: string;
    Notified_date: string;
    Order_id: number;
    Is_read: number;
}

export function NotificationPopover() {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // ฟังก์ชันสำหรับดึงข้อมูลการแจ้งเตือน
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
        fetchNotifications(); // ดึงข้อมูลการแจ้งเตือนเมื่อ Component โหลดครั้งแรก
    }, []);

    // คำนวณจำนวนข้อความที่ยังไม่ได้อ่าน
    const unreadCount = notifications.filter(notification => notification.Is_read === 0).length;

    // ฟังก์ชันสำหรับอัปเดตการอ่านทั้งหมด
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
                    markAllAsRead(); // อัปเดตการอ่านในฐานข้อมูลเมื่อ Popover ถูกเปิด
                } else {
                    fetchNotifications(); // ดึงข้อมูลใหม่เมื่อ Popover ถูกปิด
                }
            }}
        >
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-[35px] border-none bg-transparent">
                    <NotiBell count={unreadCount} />
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
                                {/* จุดแสดงว่ายังไม่ได้อ่าน */}
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
                                        <span className="text-sm text-gray-400">
                                            Order ID: {notification.Order_id}
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
