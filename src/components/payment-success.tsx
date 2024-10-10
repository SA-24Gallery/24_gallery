import Link from 'next/link';
import React from 'react';

export function PaymentSuccess() {
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
      
      {/* Order Number */}
      <p className="text-[20px] font-semibold mb-[10px] ">ORDER NUMBER #12345</p>
      
      {/* Date and Time */}
      <p className="text-[16px] mb-[10px]">Date&Time: Sat 14 Sep 2024, 9:59</p>
      
      {/* Transaction Review */}
      <p className="text-[16px] text-gray-600 mb-[50px]">Your transaction is currently under review.</p>

      <Link href="/my-order-details">
        <button className="bg-black text-white text-[20px] font-bold py-[15px] px-[30px] rounded-[20px]">
          Back to my order
        </button>
      </Link>
    </div>
  );
}