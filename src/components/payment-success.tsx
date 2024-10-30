"use client";

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface OrderData {
  orderId: string;
  dateOrdered: string | null;
}

export function PaymentSuccess() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('Order ID is missing.');
      setLoading(false);
      return;
    }

    const fetchOrderData = async () => {
      try {
        const response = await fetch(`/api/get-pay-success?orderId=${orderId}`);
        if (!response.ok) throw new Error('Failed to fetch order data.');
        
        const data = await response.json();
        setOrderData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };    

    fetchOrderData();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500 text-center p-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-[60px] rounded-[30px] max-w-[593px] max-h-[569px] w-full text-center">
      <div className="flex items-center justify-center mb-[30px]">
        <svg
          xmlns="http://www.w3.org/2000/svg" 
          width="120" height="120" 
          viewBox="0 0 24 24" 
          fill="none" stroke="currentColor" 
          strokeWidth="1" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="lucide lucide-circle-check-big">
          <path d="M21.801 10A10 10 0 1 1 17 3.335"/>
          <path d="m9 11 3 3L22 4"/>
        </svg>
      </div>
      <h1 className="text-[32px] font-bold mb-[25px]">Payment Successful</h1>
      
      <p className="text-[20px] font-semibold mb-[10px]">ORDER NUMBER #{orderData?.orderId}</p>

      <p className="text-[16px] mb-[10px]">
        Order Date&Time: {orderData?.dateOrdered ? new Date(orderData.dateOrdered).toLocaleString() : 'N/A'}
      </p>
      
      <p className="text-[16px] text-gray-600 mb-[50px]">Your transaction is currently under review.</p>

      <Link href="/my-orders-list">
        <button className="bg-black text-white text-[20px] font-bold py-[15px] px-[30px] rounded-[20px]">
          Back to my order
        </button>
      </Link>
    </div>
  );
}