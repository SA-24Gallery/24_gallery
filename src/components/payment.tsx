import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export default function Payment() {
  return (
    <div className="bg-white p-8 rounded-[30px] max-w-[693px] w-full text-center">
        <div className="flex justify-center mb-6">
            <Image
            src="/images/paymentqr.svg" // QR code path
            alt="QR Code"
            width={333}
            height={450}
            />
        </div>

        <div className="flex flex-col justify-center items-center mb-6 w-full">
        {/* Row for Total Price */}
        <div className="flex flex-row justify-center items-center gap-2 mb-4">
            <span className="font-bold text-[16px]">Total price:</span>
            <span className="font-bold text-[16px]">350.00 Baht</span>
        </div>
  
        {/* Row for Upload Receipt */}
        <div className="flex flex-row justify-center items-center gap-2 w-full">
            <label htmlFor="upload" className="text-[16px] font-medium">
            Upload receipt:
            </label>
            <input
            type="file"
            id="upload"
            className="border border-gray-400 py-2 px-4 rounded-lg w-64"
            />
        </div>
        </div>
        <button className="bg-black text-white text-[16px] font-bold py-3 px-8 rounded-[10px] mt-4">
        Done
        </button>
    </div>
  );
}