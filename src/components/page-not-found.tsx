import Link from 'next/link';
import React from 'react';

export function PageNotFound() {
  return (
    <div className="p-[60px] rounded-[30px] max-w-[693px] max-h-[462px] w-full text-center">
      <div className="flex items-center justify-center mb-[10px]">
        <svg 
          xmlns="http://www.w3.org/2000/svg"
          width="200" 
          height="200" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="lucide lucide-triangle-alert"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
          <path d="M12 9v4"/>
          <path d="M12 17h.01"/>
        </svg>
      </div>
      <h1 className="text-[32px] font-bold mb-[10px]">PAGE NOT FOUND</h1>
      <h2 className="text-[20px] font-medium mb-[40px]">The page you were looking for doesn’t exist.</h2>
      <Link href="/">
        <button className="bg-black text-white text-[20px] font-bold py-[15px] px-[30px] rounded-[20px]">
          Back to home
        </button>
      </Link>
    </div>
  );
}