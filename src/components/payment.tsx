"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, ChangeEvent } from 'react';

export default function Payment() {
  // State to track if a file has been uploaded
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  // State to store the uploaded file
  const [file, setFile] = useState<File | null>(null);

  // Handler for file input change
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const selectedFile = selectedFiles[0];
      setFileUploaded(true);
      setFile(selectedFile);
    } else {
      setFileUploaded(false);
      setFile(null);
    }
  };

  // Handler for Done button click
  const handleDoneClick = (): void => {
    if (file) {
      // Implement your submission logic here
      console.log('File uploaded:', file);
      // Example: You might upload the file to a server or perform other actions
    }
  };

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
            accept="image/*,application/pdf" // Optional: restrict file types
            className="border border-gray-400 py-2 px-4 rounded-lg w-64"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <Link href="/payment-success">
        <button
          className={`text-white text-[18px] font-bold py-3 px-8 rounded-[10px] mt-4 ${
            fileUploaded
              ? 'bg-black cursor-pointer'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          onClick={handleDoneClick}
          disabled={!fileUploaded}
        >
          Done
        </button>
      </Link>
    </div>
  );
}