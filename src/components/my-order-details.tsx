"use client";

import React, { useEffect, useState } from "react";
import ProductItem from "@/components/order-details/product-item";
import OrderTimeline from "@/components/order-details/order-timeline";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation"; // Ensure you import this

export default function MyOrderDetailsPage() {
  const [order, setOrder] = useState<any | null>(null);
  const [statuses, setStatuses] = useState<any[]>([]); // Store status information
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const router = useRouter(); // Initialize router

  useEffect(() => {
    async function fetchOrderDetails() {
      try {
        const response = await fetch(`/api/orders?orderId=${orderId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch order details: ${response.statusText}`);
        }
        const orderData = await response.json();
        setOrder(orderData[0]);

        // Fetch statuses for the order
        const statusResponse = await fetch(`/api/show-status?orderId=${orderId}`);
        if (!statusResponse.ok) {
          throw new Error(`Failed to fetch statuses: ${statusResponse.statusText}`);
        }
        const statusData = await statusResponse.json();
        setStatuses(statusData); // Store status in state
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

  const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  // Function to map shipping option from 'D' or 'P' to their full names
  const getShippingOptionDisplay = (option: string) => {
    if (option === 'D') return 'Delivery';
    if (option === 'P') return 'Pick Up';
    return 'Unknown'; // Fallback in case of an unexpected value
  };

  // Function to map paymentStatus to its corresponding display value
  const getPaymentStatusDisplay = (paymentStatus: string) => {
    if (paymentStatus === "A") {
      return "Payment Approved";
    } else if (paymentStatus === "N") {
      return "Payment Not Approved";
    } else if (paymentStatus === "P") {
      return "Payment Pending";
    }
    return "Unknown Payment Status";
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
    (total: number, product: any) => total + product.price * product.quantity,
    0
  ) + shippingCost;

  return (
    <div className="w-full flex justify-center">
      <div className="flex flex-col lg:flex-row justify-between gap-8 max-w-7xl w-full p-8 bg-white rounded-[20px]">
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
            <p>{new Date(order.dateOrdered).toLocaleDateString()}</p>
            <h3 className="font-bold mb-1 mt-4">Date received</h3>
            <p>{order.dateReceived ? new Date(order.dateReceived).toLocaleDateString() : '-'}</p>
          </div>

          <div>
            <h3 className="font-bold mb-2">Optional Notes or Address</h3>
            <textarea
              value={order.note || "No additional notes provided."}
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
              rows={3}
              readOnly
            />
          </div>

          {/* Order Timeline Component */}
          <OrderTimeline
              steps={statuses.map((status) => ({
                title: status.statusName,
                date: status.statusDate ? new Date(status.statusDate).toLocaleDateString() : null, // Check if statusDate exists
                time: status.statusDate ? new Date(status.statusDate).toLocaleTimeString() : null, // Check if statusDate exists
                completed: status.isCompleted === 1,
              }))}
            />

        </div>

        {/* Right Section */}
        <div className="flex-1 bg-white p-6 rounded-lg flex flex-col space-y-6">
          <div>
              <div className="mt-12">
              <h3 className="font-bold mb-1">Payment Status</h3>
              <p>{getPaymentStatusDisplay(order.paymentStatus)}</p>
            </div>
            <h3 className="font-bold mb-1 mt-4">Shipping Option</h3>
            <p>{getShippingOptionDisplay(order.shippingOption)}</p>
            {order.shippingOption === "D" && order.trackingNumber && (
              <p>Tracking Number: #{order.trackingNumber}</p>
            )}

            <h3 className="font-bold mb-2 mt-4">Details</h3>

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
                        price_per_unit={product.price / product.quantity}
                        folderPath={product.folderPath}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500">No items in the order.</p>
            )}

            <div className="flex justify-between items-center mt-4">
              <p className="text-[20px] font-bold">Total price: {totalPrice || 0} Baht</p>
              {order.paymentStatus == "N" && (
                <Button
                  variant="default"
                  size="default"
                  className="text-[20px] px-10 py-6 font-bold"
                  onClick={() =>
                    router.push(`/payment?orderId=${order.orderId}&totalPrice=${totalPrice}`)
                  }
                >
                  Pay
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
