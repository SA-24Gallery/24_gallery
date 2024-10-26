"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import OrderTimeline from "@/components/order-details/order-timeline";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, } from "@/components/ui/alert-dialog";
import { useRouter, useSearchParams } from 'next/navigation';
import ProductItem from "@/components/order-details/product-item";

interface OrderType {
    orderId: string;
    customer: string;
    email: string;
    phone: string;
    dateOrdered: string;
    dateReceived: string;
    notes: string;
    payment_status: string;
    shippingOption: string;
    products: ProductType[];
    trackingNumber: string;
    receipt_pic: string;
    statusTimeline: StatusStep[];
}

interface ProductType {
    albumName: string;
    size: string;
    paperType: string;
    printingFormat: string;
    quantity: number;
    price: number;
    folderPath: string;
}

interface StatusStep {
    title: string;
    date: string;
    time: string;
    completed: boolean;
}

export default function ManageOrderDetails() {
    const [steps, setSteps] = useState<StatusStep[]>([]);
    const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
    const [order, setOrder] = useState<OrderType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");

    // แยก fetchOrderDetails ออกมาเป็นฟังก์ชันที่เรียกใช้ได้
    const fetchOrderDetails = async () => {
        try {
            const response = await fetch(`/api/orders?orderId=${orderId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch order details: ${response.statusText}`);
            }
            const orderData = await response.json();
            if (orderData && orderData.length > 0) {
                const fetchedOrder = orderData[0];
                setOrder({
                    orderId: fetchedOrder.orderId,
                    customer: fetchedOrder.customer,
                    email: fetchedOrder.email,
                    phone: fetchedOrder.phone,
                    dateOrdered: fetchedOrder.dateOrdered,
                    dateReceived: fetchedOrder.dateReceived,
                    notes: fetchedOrder.note || "",
                    payment_status: fetchedOrder.paymentStatus || "N",
                    shippingOption: fetchedOrder.shippingOption || "N/A",
                    trackingNumber: fetchedOrder.trackingNumber || "",
                    receipt_pic: fetchedOrder.receipt_pic || "",
                    statusTimeline: fetchedOrder.statusTimeline || [],
                    products: fetchedOrder.products.map((product: any) => ({
                        albumName: product.albumName,
                        size: product.size,
                        paperType: product.paperType,
                        printingFormat: product.printingFormat,
                        quantity: product.quantity,
                        price: product.price / product.quantity,
                        folderPath: product.folderPath,
                    })),
                });
                setSteps(fetchedOrder.statusTimeline || []);
            } else {
                setOrder(null);
                setError("Order not found.");
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        } else {
            setLoading(false);
            setError("No order ID provided.");
        }
    }, [orderId]);

    const handleStatusUpdate = async () => {
        if (!order) return;

        try {
            const response = await fetch(`/api/orders`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order.orderId,
                    status: steps[currentStatusIndex + 1]?.title,
                    // เพิ่มข้อมูลอื่นๆ ที่มีอยู่เดิม
                    shippingOption: order.shippingOption,
                    note: order.notes,
                    receivedDate: order.dateReceived,
                    trackingNumber: order.trackingNumber,
                    payment_status: order.payment_status,
                    order_date: order.dateOrdered
                }),
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to update status: ${response.statusText}`);
            }

            if (currentStatusIndex < steps.length - 1) {
                const newSteps = steps.map((step, index) => {
                    if (index <= currentStatusIndex + 1) {
                        return { ...step, completed: true };
                    }
                    return step;
                });
                setSteps(newSteps);
                setCurrentStatusIndex(currentStatusIndex + 1);
            }

            // Refresh data
            await fetchOrderDetails();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handlePaymentUpdate = async () => {
        if (!order) return;

        try {
            const response = await fetch('/api/orders', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order.orderId,
                    payment_status: 'A',
                    // ส่งข้อมูลอื่นๆ ที่มีอยู่เดิม
                    shippingOption: order.shippingOption,
                    note: order.notes,
                    receivedDate: order.dateReceived,
                    trackingNumber: order.trackingNumber,
                    order_date: order.dateOrdered
                }),
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to update payment status: ${response.statusText}`);
            }

            // Update local state temporarily
            setOrder({
                ...order,
                payment_status: 'A'
            });

            // Refresh data to ensure we have the latest state
            await fetchOrderDetails();
        } catch (error) {
            console.error('Error updating payment status:', error);
        }
    };

    const handleTrackingNumberUpdate = async (trackingNumber: string) => {
        if (!order) return;

        try {
            const response = await fetch(`/api/orders`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order.orderId,
                    trackingNumber: trackingNumber,
                    // ส่งข้อมูลอื่นๆ ที่มีอยู่เดิม
                    shippingOption: order.shippingOption,
                    note: order.notes,
                    receivedDate: order.dateReceived,
                    payment_status: order.payment_status,
                    order_date: order.dateOrdered
                }),
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to update tracking number: ${response.statusText}`);
            }

            await fetchOrderDetails();
        } catch (error) {
            console.error('Error updating tracking number:', error);
        }
    };

    const formatDate = (dateString: string): string => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };

    if (loading) {
        return <div>Loading order details...</div>;
    }

    if (error) {
        return <div>Error fetching order details: {error}</div>;
    }

    if (!order) {
        return <div>No order found.</div>;
    }

    const shippingCost = order.shippingOption === "D" ? 50 : 0;

    const totalPrice = order.products.reduce(
        (total: number, product: ProductType) => total + product.price * product.quantity,
        0
    ) + shippingCost;

    return (
        <div className="w-full flex justify-center">
            <div className="flex flex-col lg:flex-row justify-between gap-8 max-w-7xl w-full p-8 bg-white rounded-lg shadow-md">
                {/* Left Section */}
                <div className="flex-1 bg-white p-6 rounded-lg space-y-6">
                    <h2 className="text-2xl font-bold mb-4">Order ID #{order.orderId}</h2>
                    <div>
                        <h3 className="font-bold mb-1">Customer</h3>
                        <p>Name: {order.customer}</p>
                        <p>Email: {order.email}</p>
                        <p>Phone: {order.phone}</p>
                    </div>
                    <div>
                        <h3 className="font-bold mb-1">Date ordered</h3>
                        <p>{formatDate(order.dateOrdered)}</p>
                    </div>
                    <div>
                        <h3 className="font-bold mb-1">Date received</h3>
                        <p>{order.dateReceived ? formatDate(order.dateReceived) : "N/A"}</p>
                    </div>
                    <div>
                        <h3 className="font-bold mb-1">Notes</h3>
                        <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-50">
                            <p>{order.notes || "No notes available."}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold mb-1">Status</h3>
                        <OrderTimeline steps={steps} />
                        <div className="flex space-x-4 mt-4">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="default">Update</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirm Status Update</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to update the status? This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel asChild>
                                            <Button variant="secondary">Cancel</Button>
                                        </AlertDialogCancel>
                                        <AlertDialogAction asChild>
                                            <Button onClick={handleStatusUpdate} variant="default">
                                                Confirm
                                            </Button>
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex-1 bg-white p-6 rounded-lg flex flex-col space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Order Information</h2>
                        <p className="mb-2">
                            Shipping option: {order.shippingOption === "D" ? "Delivery" : "Pick Up"}
                        </p>

                        {order.trackingNumber && (
                            <p className="mb-2">Tracking Number: {order.trackingNumber}</p>
                        )}

                        <p className="mb-2">
                            Payment status: {
                                order.payment_status === 'N' ? 'Not Approved' :
                                order.payment_status === 'P' ? 'Payment Pending' :
                                order.payment_status === 'A' ? 'Approved' : 'Unknown'
                            }
                        </p>

                        <div className="flex space-x-4 mb-4">
                            <Button 
                                variant="default" 
                                size="default" 
                                disabled={!order.receipt_pic}
                            >
                                {order.receipt_pic ? (
                                    <a href={order.receipt_pic} target="_blank" rel="noopener noreferrer">
                                        View Receipt
                                    </a>
                                ) : (
                                    "No Receipt Available"
                                )}
                            </Button>

                            {(order.payment_status === 'N' || order.payment_status === 'P') && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="default" size="default">
                                            Update Payment
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirm Payment Update</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to approve this payment? This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel asChild>
                                                <Button variant="secondary">Cancel</Button>
                                            </AlertDialogCancel>
                                            <AlertDialogAction asChild>
                                                <Button onClick={handlePaymentUpdate} variant="default">
                                                    Confirm
                                                </Button>
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>

                        <p className="font-bold mb-4">Total price: {totalPrice} Baht</p>
                        <h3 className="font-bold mb-4">Details</h3>
                        {order.products.length > 0 ? (
                            <div className="max-h-80 overflow-y-auto mb-4">
                                <div className="bg-gray-200 p-4 rounded-lg">
                                    {order.products.map((product: ProductType, index: number) => (
                                        <div key={index} className="relative mb-4">
                                            <ProductItem
                                                album_name={product.albumName}
                                                size={product.size}
                                                paper_type={product.paperType}
                                                printing_format={product.printingFormat}
                                                product_qty={product.quantity}
                                                price_per_unit={product.price}
                                                folderPath={product.folderPath}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500">No items in the order.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}