"use client";

import React, { useState, useEffect } from "react";
import ProductItem from '@/components/order-details/product-item';
import { Button } from "@/components/ui/button";
import OrderTimeline from "@/components/order-details/order-timeline";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, } from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

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
}

interface ProductType {
  albumName: string;
  size: string;
  paperType: string;
  printingFormat: string;
  quantity: number;
  price: number;
  fileUrls: string[];
}

export default function ManageOrderDetails() {
    const [steps, setSteps] = useState<{ title: string, date: string, time: string, completed: boolean }[]>([]);
    const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
    const [order, setOrder] = useState<OrderType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");

    useEffect(() => {
        async function fetchOrderDetails() {
            try {
                const response = await fetch(`/api/orders?orderId=${orderId}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch order details: ${response.statusText}`);
                }
                const orderData = await response.json();
                if (orderData && orderData.length > 0) {
                    setOrder(orderData[0]); // Assuming the response is an array with one order object
                    setSteps(orderData[0].statusTimeline || []);
                } else {
                    setOrder(null);
                    setError("Order not found.");
                }
            } catch (error: any) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        if (orderId) {
            fetchOrderDetails();
        } else {
            setLoading(false);
            setError("No order ID provided.");
        }
    }, [orderId]);

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

    const handlePaymentUpdate = () => {
        if (order) {
            setOrder({ ...order, payment_status: "Approved" });
        }
    };

    const handleTrackingNumberUpdate = (trackingNumber: string) => {
        if (order) {
            setOrder({ ...order, trackingNumber });
        }
    };

    const formatDate = (dateString: string): string => {
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

    const totalPrice = order.products.reduce((total: number, product: ProductType) => total + (product.price * product.quantity), 0) + shippingCost;

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
                        <p>{formatDate(order.dateReceived)}</p>
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
                        <p className="mb-2">Shipping option: {order.shippingOption}</p>

                        {order.trackingNumber && (
                            <p className="mb-2">Tracking Number: {order.trackingNumber}</p>
                        )}

                        <p className="mb-2">Payment status: {order.payment_status}</p>

                        <div className="flex space-x-4 mb-4">
                            <Button variant="default" size="default">
                                <a href={order.receipt_pic} target="_blank" rel="noopener noreferrer">
                                    View Receipt
                                </a>
                            </Button>

                            {order.payment_status !== "Approved" && (
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
                                                url={product.fileUrls[0]} 
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
