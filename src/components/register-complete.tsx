import Link from 'next/link';
import React from 'react';

export function RegisterComplete() {
  return (
    <div className="bg-white p-[60px] rounded-[30px] max-w-[693px] max-h-[462px] w-full text-center">
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
      <h1 className="text-[28px] font-bold mb-[50px]">You have successfully registered !</h1>
      <Link href="/login">
        <button className="bg-black text-white text-[20px] font-bold py-[15px] px-[30px] rounded-[20px]">
          Back to Login
        </button>
      </Link>
    </div>
  );
}