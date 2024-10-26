"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import ProductItem from '@/components/order-details/product-item';
import { Button } from "@/components/ui/button";

export default function MyCartForm() {
    const router = useRouter();

    // State for managing the order
    const [order, setOrder] = useState<{
        order_id: string;
        customer_name: string;
        email: string;
        phone: string;
        order_date: string;
        received_date: string;
        payment_status: string;
        products: any[];
    } | null>(null);

    const [loading, setLoading] = useState(true);
    const [shippingOption, setShippingOption] = useState("");
    const shippingCost = shippingOption === "ThailandPost" ? 50 : 0;

    // Fetch order data from the API when the component mounts
    useEffect(() => {
        const fetchOrderData = async () => {
            try {
                const response = await fetch('/api/orders?payment_status=N&order_date_null=true', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });

                if (!response.ok) {
                    console.error('Failed to fetch order data');
                    setOrder(null);
                    return;
                }

                const data = await response.json();
                if (data && data.length > 0) {
                    const orderData = data[0]; // Assuming you want to display the first unpaid order
                    setOrder({
                      order_id: orderData.orderId,
                      customer_name: orderData.customer,
                      email: orderData.email,
                      phone: orderData.phone,
                      order_date: orderData.dateOrdered || "",
                      received_date: orderData.dateReceived || "",
                      payment_status: orderData.paymentStatus || 'N',
                      products: orderData.products.map((product: any) => ({
                        product_id: product.productId, // Include product_id
                        album_name: product.albumName,
                        size: product.size,
                        paper_type: product.paperType,
                        printing_format: product.printingFormat,
                        product_qty: product.quantity,
                        price_per_unit: product.price / product.quantity,
                        url: product.fileUrls,
                      })),
                    });
                  } else {
                    setOrder(null);
                  }
            } catch (err) {
                console.error('Error fetching order data:', err);
                setOrder(null);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderData();
    }, []);

    const handlePayment = () => {
        if (order && order.products.length > 0) {
            router.push(`/payment?orderId=${order.order_id}`);
        }
    };

    const handleRemoveProduct = async (index: number) => {
        if (!order) return;
      
        const productToRemove = order.products[index];
        const updatedProducts = order.products.filter((_, i) => i !== index);
      
        try {
          // Send DELETE request to remove the product
          const response = await fetch(`/api/orders?orderId=${order.order_id}&productId=${productToRemove.product_id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });
      
          if (!response.ok) {
            console.error('Failed to remove product');
          } else {
            // Update the local state
            if (updatedProducts.length === 0) {
              // If no products left, set order to null
              setOrder(null);
            } else {
              setOrder({ ...order, products: updatedProducts });
            }
          }
        } catch (err) {
          console.error('Error removing product:', err);
        }
      };
      

    const totalPrice = (order?.products.reduce((total, product) => {
        return total + (product.price_per_unit * product.product_qty);
    }, 0) || 0) + shippingCost;

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="w-full flex justify-center">
            <div className="flex flex-col lg:flex-row justify-between gap-8 max-w-7xl w-full p-8 bg-white rounded-lg shadow-md">
                {/* Left Section */}
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
                                <p>{order.order_date ? formatDate(order.order_date) : "N/A"}</p>
                            </div>
                            <div className="mb-4">
                                <h3 className="font-bold">Date received</h3>
                                <p>{order.received_date ? formatDate(order.received_date) : "N/A"}</p>
                            </div>
                            <div className="mb-4">
                                <h3 className="font-bold">Notes</h3>
                                <textarea className="w-full p-2 border border-gray-300 rounded-md" rows={3}></textarea>
                            </div>
                        </>
                    ) : (
                        <p className="text-center text-gray-500">No items in your cart.</p>
                    )}
                </div>

                {/* Right Section */}
                <div className="flex-1 bg-white p-6 rounded-lg flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Order Information</h2>
                        {order ? (
                            <>
                                {/* Payment Status Display */}
                                <p className="mb-2">
                                    Payment status: {order.payment_status === 'N' ? 'Not Approved' : 'Paid'}
                                </p>
                                <h3 className="font-bold mb-4">Details</h3>

                                {order.products.length > 0 ? (
                                    <div className="max-h-80 overflow-y-auto mb-4">
                                        <div className="bg-gray-200 p-4 rounded-lg">
                                            {order.products.map((product, index) => (
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