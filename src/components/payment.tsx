"use client";
import { useState, ChangeEvent } from 'react';

export default function Payment() {
  // State to track if a file has been uploaded
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  // State to store the uploaded file
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handler for file input change
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const selectedFile = selectedFiles[0];
      setFileUploaded(true);
      setFile(selectedFile);
      setError(null);
    } else {
      setFileUploaded(false);
      setFile(null);
    }
  };

  // Handler for Done button click
  const handleDoneClick = async (): Promise<void> => {
    if (!file) {
      return;
    }

    setIsUploading(true);
    try {
      // Upload to AWS
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const { url: receiptUrl } = await uploadResponse.json();
      console.log('Upload successful:', receiptUrl);
      
      // Redirect to success page
      window.location.href = '/payment-success';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setFileUploaded(false);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[30px] max-w-[693px] w-full text-center">
      <div className="flex justify-center mb-6">
        <img
          src="/images/paymentqr.svg"
          alt="QR Code"
          className="w-[333px] h-[450px]"
        />
      </div>
      <div className="flex flex-col justify-center items-center mb-6 w-full">
        {/* Row for Total Price */}
        <div className="flex flex-row justify-center items-center gap-2 mb-4">
          <span className="font-bold text-[16px]">Total price:</span>
          <span className="font-bold text-[16px]">350.00 Baht</span>
        </div>
        {/* Row for Upload Receipt */}
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="flex flex-row justify-center items-center gap-2">
            <label htmlFor="upload" className="text-[16px] font-medium">
              Upload receipt:
            </label>
            <input
              type="file"
              id="upload"
              accept="image/*,application/pdf"
              className="border border-gray-400 py-2 px-4 rounded-lg w-64"
              onChange={handleFileChange}
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
      <button
        className={`text-white text-[18px] font-bold py-3 px-8 rounded-[10px] mt-4 ${
          fileUploaded && !isUploading
            ? 'bg-black cursor-pointer'
            : 'bg-gray-400 cursor-not-allowed'
        }`}
        onClick={handleDoneClick}
        disabled={!fileUploaded || isUploading}
      >
        {isUploading ? 'Uploading...' : 'Done'}
      </button>
    </div>
  );
}