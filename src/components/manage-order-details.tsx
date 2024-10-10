"use client";

import React, { useState } from "react";
import ProductItem from '@/components/order-details/product-item';
import { Button } from "@/components/ui/button";
import OrderTimeline from "@/components/order-details/order-timeline";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,} from "@/components/ui/alert-dialog";

export default function ManageOrderDetails() {
    
    const initialSteps = [
        { title: "Receive order", date: "10/9/2024", time: "10:00", completed: false },
        { title: "Order completed", date: "10/9/2024", time: "10:20", completed: false },
        { title: "Shipped", date: "", time: "", completed: false },
    ];

    const [steps, setSteps] = useState(initialSteps);
    const [currentStatusIndex, setCurrentStatusIndex] = useState(0);

    const order = {
        order_id: "12345",
        customer_name: "Carina Ningning",
        email: "carina88@gmail.com",
        phone: "088-8888888",
        order_date: "2024-10-09",
        received_date: "2024-12-09",
        payment_status: "Pending",
        shipping_option: "ThailandPost",
        notes: "ส่งมาที่ บ้านนี้มีรัก",
        receipt_pic: "https://example.com/receipt"
    };

    const initialProducts = [
        {
            album_name: "Concert 10/10/2024",
            size: "14x14",
            paper_type: "matte",
            printing_format: "full page",
            product_qty: 2,
            price_per_unit: 100,
            url: "#",
        },
        {
            album_name: "Concert 10/10/2024",
            size: "14x14",
            paper_type: "matte",
            printing_format: "full page",
            product_qty: 2,
            price_per_unit: 150,
            url: "#",
        },
    ];

    const [products, setProducts] = useState(initialProducts);
    const [trackingNumber, setTrackingNumber] = useState("");
    const [savedTrackingNumber, setSavedTrackingNumber] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
    const shippingCost = 50;

    const totalPrice = products.reduce((total, product) => {
        return total + (product.price_per_unit * product.product_qty);
    }, 0) + shippingCost;

    const handleTrackingNumberUpdate = () => {
        setSavedTrackingNumber(trackingNumber);
        setIsDialogOpen(false);
    };

    const handlePaymentUpdate = () => {
        setPaymentStatus("Approved");
    };

    const handleStatusUpdate = () => {
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
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };

    return (
        <div className="w-full flex justify-center">
            <div className="flex flex-col lg:flex-row justify-between gap-8 max-w-7xl w-full p-8 bg-white rounded-lg shadow-md">
                {/* Left Section */}
                <div className="flex-1 bg-white p-6 rounded-lg space-y-6">
                    <h2 className="text-2xl font-bold mb-4">Order ID #{order.order_id}</h2>
                    <div>
                        <h3 className="font-bold mb-1">Customer</h3>
                        <p>Name: {order.customer_name}</p>
                        <p>Email: {order.email}</p>
                        <p>Phone: {order.phone}</p>
                    </div>
                    <div>
                        <h3 className="font-bold mb-1">Date ordered</h3>
                        <p>{formatDate(order.order_date) || "null"}</p>
                    </div>
                    <div>
                        <h3 className="font-bold mb-1">Date received</h3>
                        <p>{formatDate(order.received_date) || "null"}</p>
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
                        <p className="mb-2">Shipping option: {order.shipping_option}</p>
                        
                        {savedTrackingNumber && (
                            <p className="mb-2">Tracking Number: {savedTrackingNumber}</p>
                        )}

                        {order.shipping_option === "ThailandPost" && (
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="default" size="default">
                                        Add Tracking Number
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Tracking Number</DialogTitle>
                                        <DialogDescription>
                                            Enter the tracking number for this order.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <input
                                        type="text"
                                        placeholder="Enter tracking number"
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                        className="border border-gray-300 p-2 rounded-md w-full mb-2"
                                    />
                                    <DialogFooter>
                                        <Button onClick={handleTrackingNumberUpdate}>
                                            Update Tracking Number
                                        </Button>
                                        <DialogClose asChild>
                                            <Button variant="secondary">Close</Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}

                        <p className="mb-2">Payment status: {paymentStatus}</p>

                        <div className="flex space-x-4 mb-4">
                            <Button variant="default" size="default">
                                <a href={order.receipt_pic} target="_blank" rel="noopener noreferrer">
                                    View Receipt
                                </a>
                            </Button>

                            {paymentStatus !== "Approved" && (
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
                        {products.length > 0 ? (
                            <div className="max-h-80 overflow-y-auto mb-4">
                                <div className="bg-gray-200 p-4 rounded-lg">
                                    {products.map((product, index) => (
                                        <div key={index} className="relative mb-4">
                                            <ProductItem
                                                album_name={product.album_name}
                                                size={product.size}
                                                paper_type={product.paper_type}
                                                printing_format={product.printing_format}
                                                product_qty={product.product_qty}
                                                price_per_unit={product.price_per_unit}
                                                url={product.url}
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
