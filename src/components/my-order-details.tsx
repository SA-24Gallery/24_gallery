"use client";

import React, { useEffect, useState } from "react";
import ProductItem from "@/components/order-details/product-item";
import OrderTimeline from "@/components/order-details/order-timeline";
import { useSearchParams } from "next/navigation"; // For retrieving query parameters

export default function MyOrderDetailsPage() {
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId"); // Get orderId from the URL

  useEffect(() => {
    async function fetchOrderDetails() {
      try {
        const response = await fetch(`/api/orders?orderId=${orderId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch order details: ${response.statusText}`);
        }
        const orderData = await response.json();
        setOrder(orderData[0]); // Assuming the response is an array with one order object
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  // Function to map shipping option from 'D' or 'P' to their full names
  const getShippingOptionDisplay = (option: string) => {
    if (option === 'D') return 'Delivery';
    if (option === 'P') return 'Pick Up';
    return 'Unknown'; // Fallback in case of an unexpected value
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

  const shippingCost = order.shippingOption === "D" ? 50 : 0; // Assuming 'D' means delivery

  const totalPrice = order.products.reduce((total: number, product: any) => total + (product.price * product.quantity), 0) + shippingCost;

  const steps = order.statusTimeline || [];

  return (
    <div className="w-full flex justify-center">
      <div className="flex flex-col lg:flex-row justify-between gap-8 max-w-7xl w-full p-8 bg-white rounded-lg shadow-md">
        {/* Left Section */}
        <div className="flex-1 bg-white p-6 rounded-lg space-y-6">
          <h2 className="text-2xl font-bold mb-4">Order ID #{order.orderId}</h2>
          <div>
            <h3 className="font-bold mb-1">Customer</h3>
            <p>Name: {order.customer}</p> {/* Display customer name */}
            <p>Email: {order.email}</p>
            <p>Phone: {order.phone}</p> {/* Display phone */}
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
            <h3 className="font-bold mb-1">Optional Notes or Address</h3>
            <textarea
              value={order.notes}
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
              rows={3}
              readOnly
            />
          </div>
          <div>
            <h3 className="font-bold mb-1">Status</h3>
            <OrderTimeline steps={steps} />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex-1 bg-white p-6 rounded-lg flex flex-col space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Order Information</h2>
              {/* Payment Status Section */}
              <div>
                  {order.paymentStatus === 'N' && (
                       <p className="text-red-500 font-bold">Payment Not Approved</p>
                     )}
                     {order.paymentStatus === 'A' && (
                        <p className="text-green-500 font-bold">Payment Approved</p>
                     )}
              </div>
              
            <p>Shipping option: {getShippingOptionDisplay(order.shippingOption)}</p>

            {order.shippingOption === "D" && (
              <p>Tracking Number: #{order.trackingNumber}</p>
            )}

            <p className="font-bold mb-2">Total price: {totalPrice} Baht</p>
            <h3 className="font-bold mb-2">Details</h3>

            {order.products.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                <div className="bg-gray-200 p-4 rounded-lg">
                  {order.products.map((product: any, index: number) => (
                    <div key={index} className="relative mb-4">
                      <ProductItem
                        album_name={product.albumName}
                        size={product.size}
                        paper_type={product.paperType}
                        printing_format={product.printingFormat}
                        product_qty={product.quantity}
                        price_per_unit={product.price}
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
