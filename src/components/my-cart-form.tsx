"use client";

import React, { useState, useEffect } from "react";
import ProductItem from '@/components/ui/product-item';
import { Button } from "@/components/ui/button"; 

export default function MyCartForm() {
    // mock data
    const order = {
        order_id: "12345",
        customer_name: "Carina Ningning",
        email: "carina88@gmail.com",
        phone: "088-8888888",
        order_date: "2024-10-05",
        received_date: "2024-10-07",
        payment_status: "Not approved",
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
    const [shippingOption, setShippingOption] = useState(""); 
    const shippingCost = shippingOption === "ThailandPost" ? 50 : 0;

    // คำนวณ Total Price โดยรวมราคาจากแต่ละสินค้าและค่าจัดส่ง
    const totalPrice = products.reduce((total, product) => {
        return total + (product.price_per_unit * product.product_qty);
    }, 0) + shippingCost;

    const handleRemoveProduct = (index: number) => {
        const updatedProducts = products.filter((_, i) => i !== index);
        setProducts(updatedProducts);
    };

    return (
        <div className="w-full flex justify-center">
            <div className="flex flex-col lg:flex-row justify-between gap-8 max-w-7xl w-full p-8 bg-white rounded-lg shadow-md">
                {/* Left Section */}
                <div className="flex-1 bg-white p-6 rounded-lg">
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
                                className={`px-3 py-1 rounded-full ${shippingOption === "ThailandPost" ? "bg-gray-400" : "bg-gray-200"}`} 
                                onClick={() => setShippingOption("ThailandPost")}
                            >
                                ThailandPost
                            </button>
                            <button 
                                className={`px-3 py-1 rounded-full ${shippingOption === "PickUp" ? "bg-gray-400" : "bg-gray-200"}`} 
                                onClick={() => setShippingOption("PickUp")}
                            >
                                Pick up
                            </button>
                        </div>
                    </div>
                    <div className="mb-4">
                        <h3 className="font-bold">Date ordered</h3>
                        <p>{order.order_date || "null"}</p>
                    </div>
                    <div className="mb-4">
                        <h3 className="font-bold">Date received</h3>
                        <p>{order.received_date || "null"}</p>
                    </div>
                    <div className="mb-4">
                        <h3 className="font-bold">Notes</h3>
                        <textarea className="w-full p-2 border border-gray-300 rounded-md" rows={3}></textarea>
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex-1 bg-white p-6 rounded-lg shadow-md flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Order Information</h2>
                        <p className="mb-2">Payment status: {order.payment_status}</p>
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
                            <p className="text-center text-gray-500">No items in your cart.</p>
                        )}
                    </div>

                    <div className="flex justify-between items-center mt-4">
                        <p className="text-xl font-bold">Total price: {totalPrice} Baht</p>
                        <Button variant="default" size="default">Pay</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
