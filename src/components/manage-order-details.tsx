"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import OrderTimeline from "@/components/order-details/order-timeline";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSearchParams } from 'next/navigation';
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
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
    const [order, setOrder] = useState<OrderType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [trackingNumberInput, setTrackingNumberInput] = useState("");
    const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
    const [currentStatusIndex, setCurrentStatusIndex] = useState(-1);
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");


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
            } else {
                setOrder(null);
                setError("Order not found.");
            }
        } catch (error: any) {
            setError(error.message);
        }
    };

    const fetchReceiptUrl = async () => {
        try {
            const response = await fetch(`/api/view-receipt?orderId=${orderId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch receipt: ${response.statusText}`);
            }
            const data = await response.json();
            setReceiptUrl(data.receiptUrl);
        } catch (error: any) {
            setError(error.message);
        }
    };
    useEffect(() => {
        if (orderId) {
            setLoading(true);
            Promise.all([
                fetchOrderDetails(),
                fetchStatusTimeline(),
                fetchReceiptUrl(),
            ]).then(() => {
                setLoading(false);
            }).catch((error) => {
                setError(error.message);
                setLoading(false);
            });
        } else {
            setLoading(false);
            setError("No order ID provided.");
        }
    }, [orderId]);
    

    const fetchStatusTimeline = async () => {
        try {
            const statusResponse = await fetch(`/api/show-status?orderId=${orderId}`);
            if (statusResponse.ok) {
                const statuses = await statusResponse.json();
    
                const formattedSteps = statuses.map((status: any) => {
                    let title = status.statusName;
    
                    
                    if (order?.shippingOption === 'P' && status.statusName.toLowerCase() === 'shipped') {
                        title = 'Ready to pick up'; 
                    }
    
                    return {
                        title,
                        date: status.statusDate ? new Date(status.statusDate).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' }) : null,
                        time: status.statusDate ? new Date(status.statusDate).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok' }) : null,
                        completed: status.isCompleted === 1
                    };
                });
    
                setSteps(formattedSteps);
    
                const lastCompletedIndex = formattedSteps.reduce((lastIndex: number, step: StatusStep, index: number) => {
                    return step.completed ? index : lastIndex;
                }, -1);
                setCurrentStatusIndex(lastCompletedIndex);
            }
        } catch (error) {
            console.error('Error fetching status timeline:', error);
        }
    };


    const handleStatusUpdate = async () => {
        if (!order || currentStatusIndex >= steps.length - 1) return;
    
        try {
            const nextStep = steps[currentStatusIndex + 1];
            
            const isCanceled = steps.some(step => 
                step.title.toLowerCase() === "canceled" && step.completed
            );
            
            if (isCanceled) {
                console.error('Cannot update status: Order is canceled');
                return;
            }
    
            if (nextStep && nextStep.title.toLowerCase() === 'canceled') {
                console.error('Cannot update to Canceled status through normal flow');
                return;
            }
    
            const response = await fetch('/api/show-status', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order.orderId,
                    skipReceiveOrder: isOrderCanceled
                }),
            });
    
            if (!response.ok) {
                throw new Error(`Failed to update status: ${response.statusText}`);
            }
    
            const updatedSteps = steps.map((step, index) => {
                if (index === currentStatusIndex + 1) {
                    return {
                        ...step,
                        completed: true,
                        date: new Date().toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' }),
                        time: new Date().toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok' })
                    };
                }
                return step;
            });
            setSteps(updatedSteps);
            setCurrentStatusIndex(currentStatusIndex + 1);
    
            if (nextStep) {
                await fetch('/api/notification/update-noti', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        orderId: order.orderId,
                        customerEmail: order.email,
                        type: 'status',
                        statusName: nextStep.title
                    }),
                });
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handlePaymentUpdate = async () => {
        if (!order) return;
    
        const isCanceled = steps.some(step => 
            step.title.toLowerCase() === "canceled" && step.completed
        );
        
        if (isCanceled) {
            console.error('Cannot update payment: Order is canceled');
            return;
        }
    
        const currentDateTime = new Date().toISOString();
    
        try {
            const response = await fetch('/api/orders', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order.orderId,
                    payment_status: 'A',
                    shippingOption: order.shippingOption,
                    note: order.notes,
                    receivedDate: currentDateTime,
                    trackingNumber: order.trackingNumber,
                    order_date: order.dateOrdered,
                    skipReceiveOrder: isOrderCanceled 
                }),
                credentials: 'include',
            });
    
            if (!response.ok) {
                throw new Error(`Failed to update payment status: ${response.statusText}`);
            }

            await fetch('/api/notification/update-noti', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order.orderId,
                    customerEmail: order.email,
                    type: 'payment'
                }),
            });

            const updateStatusResponse = await fetch('/api/show-status', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order.orderId,
                    statusName: 'Receive order',
                    isCompleted: 1,
                }),
            });

            if (!updateStatusResponse.ok) {
                throw new Error(`Failed to update order status: ${updateStatusResponse.statusText}`);
            }

            await fetchOrderDetails();
            await fetchStatusTimeline();
            
        } catch (error) {
            console.error('Error updating payment status:', error);
        }
    };

    const handleCancelOrder = async () => {
        if (!order) return;
      
        try {
            const response = await fetch('/api/orders', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order.orderId,
                    payment_status: 'C',
                    shippingOption: order.shippingOption,
                    note: order.notes,
                    trackingNumber: order.trackingNumber,
                    order_date: order.dateOrdered,
                }),
                credentials: 'include',
            });
      
            if (!response.ok) {
                throw new Error(`Failed to cancel order: ${response.statusText}`);
            }
    

            setOrder(prevOrder => prevOrder ? {
                ...prevOrder,
                payment_status: 'C'
            } : null);
    
            const updateStatusResponse = await fetch('/api/show-status', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order.orderId,
                    statusName: 'Canceled',
                    isCompleted: 1,
                    skipReceivedDate: true
                }),
            });
    
            if (!updateStatusResponse.ok) {
                throw new Error(`Failed to update status: ${updateStatusResponse.statusText}`);
            }
    

            await fetch('/api/notification/update-noti', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order.orderId,
                    customerEmail: order.email,
                    type: 'cancel',
                }),
            });
        } catch (error) {
            console.error('Error cancelling order:', error);
        }
    };

    // Handle tracking number update
    const handleTrackingNumberUpdate = async () => {
        if (!order) return;

        try {
            const response = await fetch(`/api/orders`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order.orderId,
                    trackingNumber: trackingNumberInput,
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
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Error updating tracking number:', error);
        }
    };


    const formatDate = (dateString: string): string => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };


    const isAllStatusesCompleted = (): boolean => {
        return currentStatusIndex === steps.length - 1;
    };


    const isOrderCanceled = steps.some(
        (step) => step.title.toLowerCase() === "canceled"
    );


    useEffect(() => {
        if (orderId) {
            setLoading(true);
            Promise.all([
                fetchOrderDetails(),
                fetchStatusTimeline(),
                fetchReceiptUrl(),
            ]).then(() => {
                setLoading(false);
            }).catch((error) => {
                setError(error.message);
                setLoading(false);
            });
        } else {
            setLoading(false);
            setError("No order ID provided.");
        }
    }, [orderId]);

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
                    
                    {/* ข้อมูลลูกค้า */}
                    <div>
                        <h3 className="font-bold mb-1">Customer</h3>
                        <p>Name: {order.customer}</p>
                        <p>Email: {order.email}</p>
                        <p>Phone: {order.phone}</p>
                    </div>
    
                    {/* วันที่สั่งซื้อและรับออเดอร์ */}
                    <div>
                        <h3 className="font-bold mb-1">Date ordered</h3>
                        <p>{formatDate(order.dateOrdered)}</p>
                    </div>
                    <div>
                        <h3 className="font-bold mb-1">Date received</h3>
                        <p>{order.dateReceived ? formatDate(order.dateReceived) : "-"}</p>
                    </div>

                    <div>
                        <h3 className="font-bold mb-1">Notes</h3>
                        <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-50">
                            <p>{order.notes || "No notes available."}</p>
                        </div>
                    </div>
    
                    {/* สถานะออเดอร์ */}
                    <div>
                        <h3 className="font-bold mb-1">Status</h3>
                        {isOrderCanceled ? (
                            <div className="text-red-500 font-bold text-lg">Order is canceled</div>
                        ) : (
                            <>
                                <OrderTimeline 
                                        steps={steps.map((step) => ({
                                            ...step,
                                         
                                            title: (order?.shippingOption === 'P' && step.title.toLowerCase() === 'shipped') ? 'Ready for Pickup' : step.title
                                        }))}
                                    />
                                <div className="flex space-x-4 mt-4">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                        <Button
                                            variant="default"
                                            disabled={
                                                order.payment_status !== "A" || 
                                                isAllStatusesCompleted() || 
                                                currentStatusIndex >= steps.length - 1 ||
                                                isOrderCanceled ||
                                                steps[currentStatusIndex + 1]?.title.toLowerCase() === 'canceled'
                                            }
                                        >
                                            {order.payment_status === "A" && !isAllStatusesCompleted() && !isOrderCanceled
                                                ? "Update"
                                                : isOrderCanceled
                                                ? "Order is canceled"
                                                : isAllStatusesCompleted()
                                                ? "All statuses are completed"
                                                : "Cannot update until payment is approved"
                                            }
                                        </Button>
                                        </AlertDialogTrigger>
                                        {order.payment_status === "A" && !isAllStatusesCompleted() && (
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Confirm Status Update</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to update the status from 
                                                        "{steps[currentStatusIndex]?.title}" to 
                                                        "{steps[currentStatusIndex + 1]?.title}"?
                                                        This action cannot be undone.
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
                                        )}
                                    </AlertDialog>
                                </div>
                            </>
                        )}
                    </div>
                </div>
    
                {/* Right Section */}
                <div className="flex-1 bg-white p-6 rounded-lg flex flex-col space-y-6">
                    <div>                        
                        {/* ข้อมูลการจัดส่ง */}
                        <p className="mt-12 mb-2">
                            Shipping option: {order.shippingOption === "D" ? "Delivery" : "Pick Up"}
                        </p>
    
                        {order.trackingNumber && (
                            <p className="mb-2 mt-4">Tracking Number: {order.trackingNumber}</p>
                        )}
    
                        {/* Dialog เพิ่ม tracking number */}
                        {order.shippingOption === "D" && !isOrderCanceled && (
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button 
                                    variant="default" 
                                    disabled={order.payment_status !== "A" || isOrderCanceled}
                                >
                                    Add Tracking Number
                                </Button>
                            </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Tracking Number</DialogTitle>
                                        <DialogDescription>
                                            Please enter the tracking number for this delivery order.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <input
                                        type="text"
                                        placeholder="Enter tracking number"
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        value={trackingNumberInput}
                                        onChange={(e) => setTrackingNumberInput(e.target.value)}
                                    />
                                    <DialogFooter>
                                        <Button 
                                            variant="secondary" 
                                            onClick={() => setIsDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="default"
                                            onClick={handleTrackingNumberUpdate}
                                            disabled={!trackingNumberInput.trim()}
                                        >
                                            Save
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
    
                        {/* สถานะการชำระเงิน */}
                        <p className="mb-1 mt-4">
                            Payment status:{' '}
                            <span className={order.payment_status === 'C' ? 'font-bold text-red-500' : ''}>
                                {
                                order.payment_status === 'N' ? 'Not Approved' :
                                order.payment_status === 'P' ? 'Payment Pending' :
                                order.payment_status === 'A' ? 'Approved' :
                                order.payment_status === 'C' ? 'Canceled' : 'Unknown'
                                }
                            </span>
                            </p>
                        <p className="font-bold mb-2">Total price: {totalPrice} Baht</p>
                        <div className="space-x-4">
                            <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="default" size="default" disabled={!receiptUrl}>
                                        View Receipt
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Receipt</DialogTitle>
                                    </DialogHeader>
                                    <div className="flex justify-center">
                                        {receiptUrl ? (
                                            <img
                                                src={receiptUrl}
                                                alt="Receipt"
                                                className="w-full h-auto"
                                            />
                                        ) : (
                                            <p>No Receipt Available</p>
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>

                         {/* ปุ่ม Approve Payment */}
                    {(order.payment_status === 'P') && !isOrderCanceled && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="default" size="default">
                                    Approve Payment
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Payment Approve</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    Are you sure you want to approve this payment? This action cannot be undone.
                                    Once approved, the payment status will be updated to 'Approved' and the order status will be updated to 'Receive Order.'
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

            {/* Payment disapproved Button */}
            {order.payment_status === 'P' && !isOrderCanceled && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="default">
                         Disapprove Payment
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Order Cancellation</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to cancel this order? This action cannot be undone.
                                Once cancelled, the payment status will be updated to 'Cancelled' and the order will be marked as cancelled.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel asChild>
                                <Button variant="secondary">Go Back</Button>
                            </AlertDialogCancel>
                            <AlertDialogAction asChild>
                                <Button onClick={handleCancelOrder} variant="destructive">
                                    Confirm Cancellation
                                </Button>
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>

                        {/* ราคารวมและรายละเอียดสินค้า */}
                        <h3 className="font-bold mb-4 mt-4">Details</h3>
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