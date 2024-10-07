"use client";

import React, { useState } from "react";
import ProductItem from '@/components/order-details/product-item';
import OrderTimeline from "@/components/order-details/order-timeline";

export default function MyOrderDetailsPage() {
    const initialSteps = [
        { title: "Receive order", date: "10/9/2024", time: "10:00", completed: true },
        { title: "Order completed", date: "10/9/2024", time: "10:20", completed: true },
        { title: "Shipped", date: "", time: "", completed: false },
    ];

    const order = {
        order_id: "12345",
        customer_name: "Carina Ningning",
        email: "carina88@gmail.com",
        phone: "088-8888888",
        order_date: "2024-10-09",
        received_date: "2024-12-09",
        shipping_option: "ThailandPost",
        tracking_number: "EF58256815TH",
        notes: "ส่งมาที่ บ้านนี้มีรัก"
    };

    const initialProducts = [
        {
            album_name: "Concert 10/10/2024",
            size: "14x14",
            paper_type: "matte",
            printing_format: "full page",
            product_qty: 2,
            price_per_unit: 100,
            url: "concert-print"
        },
        {
            album_name: "Concert 10/10/2024",
            size: "14x14",
            paper_type: "matte",
            printing_format: "full page",
            product_qty: 2,
            price_per_unit: 150,
            url: "concert-print"
        },
    ];

    const [products] = useState(initialProducts);
    const [notes, setNotes] = useState(order.notes); // Make notes editable
    const shippingCost = 50;
    const totalPrice = products.reduce((total, product) => total + (product.price_per_unit * product.product_qty), 0) + shippingCost;

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };

    const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(event.target.value);
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
                        <p>{formatDate(order.order_date)}</p>
                    </div>
                    <div>
                        <h3 className="font-bold mb-1">Date received</h3>
                        <p>{formatDate(order.received_date)}</p>
                    </div>
                    <div>
                        <h3 className="font-bold mb-1">Optional Notes or Address</h3>
                        <textarea
                            value={notes}
                            onChange={handleNotesChange}
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                            rows={3}
                        />
                    </div>
                    <div>
                        <h3 className="font-bold mb-1">Status</h3>
                        <OrderTimeline steps={initialSteps} />
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex-1 bg-white p-6 rounded-lg flex flex-col space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Order Information</h2>
                        <p>Shipping option: {order.shipping_option}</p>

                        {/* Conditionally render the tracking number */}
                        {order.shipping_option !== "PickUp" && (
                            <p>Tracking Number: #{order.tracking_number}</p>
                        )}

                        <p className="font-bold mb-2">Total price: {totalPrice} Baht</p>
                        <h3 className="font-bold mb-2">Details</h3>

                        {products.length > 0 ? (
                            <div className="max-h-80 overflow-y-auto">
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
