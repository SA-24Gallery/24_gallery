"use client";
import { useState, ChangeEvent, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Payment() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const totalPrice = searchParams.get('totalPrice');

  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleDoneClick = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!file || !orderId) {
      setError('Missing file or order ID');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('productId', `receipt_${orderId}`);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || 'Failed to upload file');
      }

      const { folderUrl } = await uploadResponse.json();

      const updateResponse = await fetch('/api/update-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          receiptUrl: folderUrl,
          paymentStatus: 'P'
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update order status');
      }

      window.location.href = `/payment-success?orderId=${orderId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setFileUploaded(false);
    } finally {
      setIsUploading(false);
    }
  };

  if (!orderId || !totalPrice) {
    return <div className="text-red-500">Missing order ID or price information</div>;
  }

  return (
      <div className="bg-white p-8 rounded-[30px] max-w-[693px] w-full text-center">
        <div className="flex justify-center mb-6">
          <img
              src="/images/paymentqr.svg"
              alt="QR Code"
              className="w-[333px] h-[450px]"
          />
        </div>
        <form onSubmit={handleDoneClick} className="flex flex-col justify-center items-center mb-6 w-full">
          {/* Row for Total Price */}
          <div className="flex flex-row justify-center items-center gap-2 mb-4">
            <span className="font-bold text-[16px]">Total price:</span>
            <span className="font-bold text-[16px]">{totalPrice} Baht</span>
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
                  name="file"
                  accept="image/*,application/pdf"
                  className="border border-gray-400 py-2 px-4 rounded-lg w-64"
                  onChange={handleFileChange}
              />
            </div>
            {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>

          <button
              type="submit"
              className={`text-white text-[18px] font-bold py-3 px-8 rounded-[10px] mt-4 ${
                  fileUploaded && !isUploading
                      ? 'bg-black cursor-pointer'
                      : 'bg-gray-400 cursor-not-allowed'
              }`}
              disabled={!fileUploaded || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Done'}
          </button>
        </form>
      </div>
  );
}