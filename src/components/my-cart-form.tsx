"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import ProductItem from "@/components/order-details/product-item";

interface Product {
    product_id: string;
    album_name: string;
    size: string;
    paper_type: string;
    printing_format: string;
    product_qty: number;
    price_per_unit: number;
    folderPath: string;
}

interface OrderData {
    order_id: string;
    customer_name: string;
    email: string;
    phone: string;
    order_date: string;
    received_date: string;
    payment_status: string;
    products: Product[];
}

const calculatePaymentDeadline = (): Date => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 3);

    // If time is past 3 AM, push to 3 AM of next day
    if (deadline.getHours() >= 3) {
        deadline.setDate(deadline.getDate() + 1);
    }

    // Set time to 3 AM
    deadline.setHours(3, 0, 0, 0);

    return deadline;
};
export default function MyCartForm() {
    const router = useRouter();
    const [order, setOrder] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [shippingOption, setShippingOption] = useState("PickUp"); // Set default to "PickUp"
    const [note, setNote] = useState("");

    // คำนวณ Shipping cost 
    const shippingCost = useMemo(() => (shippingOption === "ThailandPost" ? 50 : 0), [shippingOption]);

    // คำนวณ Total price
    const totalPrice = useMemo(() => {
        if (!order?.products) return 0;
        return (
            order.products.reduce((total, product) => {
                return total + product.price_per_unit * product.product_qty;
            }, 0) + shippingCost
        );
    }, [order?.products, shippingCost]);

    const formatDate = useMemo(
        () => (dateString: string): string => {
            if (!dateString) return "N/A";
            const date = new Date(dateString);
            return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        },
        []
    );

    useEffect(() => {
        let isMounted = true;

        const fetchOrderData = async () => {
            try {
                const response = await fetch('/api/orders?order_date_null=true', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });

                if (!response.ok) {
                    console.error('Failed to fetch order data');
                    if (isMounted) setOrder(null);
                    return;
                }

                const data = await response.json();
                if (isMounted && data && data.length > 0) {
                    const orderData = data[0];
                    setOrder({
                        order_id: orderData.orderId,
                        customer_name: orderData.customer,
                        email: orderData.email,
                        phone: orderData.phone,
                        order_date: orderData.dateOrdered || "",
                        received_date: orderData.dateReceived || "",
                        payment_status: orderData.paymentStatus || 'N',
                        products: orderData.products.map((product: any) => ({
                            product_id: product.productId,
                            album_name: product.albumName,
                            size: product.size,
                            paper_type: product.paperType,
                            printing_format: product.printingFormat,
                            product_qty: product.quantity,
                            price_per_unit: product.price / product.quantity,
                            folderPath: product.folderPath,
                        })),
                    });
                } else if (isMounted) {
                    setOrder(null);
                }
            } catch (error: unknown) {
                if (error instanceof Error) {
                    console.error('Error fetching order data:', error.message);
                } else {
                    console.error('Unknown error fetching order data');
                }
                if (isMounted) setOrder(null);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchOrderData();

        return () => {
            isMounted = false;
        };
    }, []);

    const handlePayment = useCallback(async () => {
        if (!order?.products.length) return;

        try {
            const paymentDeadline = calculatePaymentDeadline();
            const shippingCode = shippingOption === "ThailandPost" ? "D" : "P";

            await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    orderId: order.order_id,
                    shippingOption: shippingCode,
                    note,
                    payment_status: 'N',
                    order_date: new Date(),
                    payment_deadline: paymentDeadline,
                }),
            });

            router.push(`/payment?orderId=${order.order_id}&totalPrice=${totalPrice}`);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error updating order:', error.message);
            } else {
                console.error('Unknown error updating order');
            }
        }
    }, [order, shippingOption, note, totalPrice, router]);

    const handleRemoveProduct = useCallback(
        async (index: number) => {
            if (!order) return;

            const productToRemove = order.products[index];
            try {
                const response = await fetch(
                    `/api/orders?orderId=${order.order_id}&productId=${productToRemove.product_id}`,
                    {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                    }
                );

                if (!response.ok) {
                    console.error('Failed to remove product');
                    return;
                }

                const updatedProducts = order.products.filter((_, i) => i !== index);
                if (updatedProducts.length === 0) {
                    setOrder(null);
                } else {
                    setOrder((prev) => (prev ? { ...prev, products: updatedProducts } : null));
                }
            } catch (error: unknown) {
                if (error instanceof Error) {
                    console.error('Error removing product:', error.message);
                } else {
                    console.error('Unknown error removing product');
                }
            }
        },
        [order]
    );

    if (loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center">
                <p className="text-lg">Loading...</p>
            </div>
        );
    }

    return (
        <div className="w-full flex justify-center">
            <div className="flex flex-col lg:flex-row justify-between gap-8 max-w-7xl w-full p-8 bg-white rounded-[20px]">
                {/* Left Column */}
                <div className="flex-1 bg-white p-6 rounded-lg">
                    {order ? (
                        <>
                            <h2 className="text-2xl font-bold mb-4">Order ID #{order.order_id}</h2>
                            <div className="mb-4">
                                <h3 className="font-bold">Customer</h3>
                                <p>Name: {order.customer_name}</p>
                                <p>Email: {order.email}</p>
                                <p>Phone: {order.phone}</p>
                            </div>
                            <div className="mb-4">
                                <h3 className="font-bold">Shipping options</h3>
                                <div className="flex gap-4">
                                    <button
                                        className={`px-3 py-1 rounded-full ${
                                            shippingOption === "ThailandPost" ? "bg-gray-400" : "bg-gray-200"
                                        }`}
                                        onClick={() => setShippingOption("ThailandPost")}
                                    >
                                        ThailandPost
                                    </button>
                                    <button
                                        className={`px-3 py-1 rounded-full ${
                                            shippingOption === "PickUp" ? "bg-gray-400" : "bg-gray-200"
                                        }`}
                                        onClick={() => setShippingOption("PickUp")}
                                    >
                                        Pick up
                                    </button>
                                </div>
                            </div>
                            <div className="mb-4">
                                <h3 className="font-bold">Date ordered</h3>
                                <p>{order.order_date ? formatDate(order.order_date) : "N/A"}</p>
                            </div>
                            <div className="mb-4">
                                <h3 className="font-bold">Date received</h3>
                                <p>{order.received_date ? formatDate(order.received_date) : "N/A"}</p>
                            </div>
                            <div className="mb-4">
                                <h3 className="font-bold">Notes</h3>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    rows={3}
                                ></textarea>
                            </div>
                        </>
                    ) : (
                        <p className="text-center text-gray-500">No items in your cart.</p>
                    )}
                </div>

                {/* Right Column */}
                <div className="flex-1 bg-white p-6 rounded-lg flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Order Information</h2>
                        {order ? (
                            <>
                                <p className="mb-2">
                                    Payment status: {order.payment_status === 'N' ? 'Not Approved' : 'Paid'}
                                </p>
                                <h3 className="font-bold mb-4">Details</h3>

                                {order.products.length > 0 ? (
                                    <div className="max-h-80 overflow-y-auto mb-4">
                                        <div className="bg-gray-200 p-4 rounded-lg">
                                            {order.products.map((product, index) => (
                                                <div key={product.product_id} className="relative mb-4">
                                                    <ProductItem {...product} />
                                                    <button
                                                        onClick={() => handleRemoveProduct(index)}
                                                        className="absolute top-2 right-2 text-black font-bold cursor-pointer"
                                                    >
                                                        x
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-500">No items in your order.</p>
                                )}
                            </>
                        ) : (
                            <p className="text-center text-gray-500">No order information available.</p>
                        )}
                    </div>

                    <div className="flex justify-between items-center mt-4">
                        <p className="text-[20px] font-bold">Total price: {totalPrice || 0} Baht</p>
                        <Button
                            variant="default"
                            size="default"
                            disabled={!order || order.products.length === 0}
                            onClick={handlePayment}
                            className="text-[20px] px-10 py-6 font-bold"
                        >
                            Pay
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}