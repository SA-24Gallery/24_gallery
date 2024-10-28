"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const OrderForm = () => {
  const router = useRouter();

  const [albumName, setAlbumName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [size, setSize] = useState('');
  const [paperType, setPaperType] = useState('');
  const [printingFormat, setPrintingFormat] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [formErrors, setFormErrors] = useState({
    albumName: false,
    files: false,
    size: false,
    paperType: false,
    printingFormat: false,
    quantity: false,
  });

  const priceList: { [key: string]: number } = {
    '2p': 39,
    '4p': 39,
    '8p': 30,
    '4 x 6': 20, // 4 x 6 price based on quantity
    '5 x 7': 25,
    '6 x 8': 30,
    '8 x 10': 60,
    '8 x 12': 60,
    '10 x 15': 180,
    '12 x 18': 250,
    '16 x 20': 300,
  };

  const calculatePrice = (size: string, quantity: number): number => {
    if (size === '4 x 6') {
      if (quantity >= 20) {
        return 4 * quantity;
      } else if (quantity >= 3) {
        return 10 * quantity;
      } else {
        return 20 * quantity;
      }
    }
    return priceList[size] * quantity; // fixed price for other sizes
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(Number(e.target.value));
  };

  const validateFiles = (fileList: File[]): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return fileList.every(file => validTypes.includes(file.type));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);


      if (selectedFiles.length > 20) {
        alert('Only 20 images allowed. Please reduce the number of files.');
        e.target.value = '';
        setFiles([]);
        return;
      }

      if (!validateFiles(selectedFiles)) {
        alert('Please upload only image files (JPEG, PNG, GIF, WEBP)');
        return;
      }
      setFiles(selectedFiles);
    }
  };

  // Upload files ใช้ API
  const uploadFiles = async (productId: string): Promise<void> => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // สร้าง FormData
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('file', file);
      });
      formData.append('productId', productId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Upload failed');
      }
      return data.folderKey;

    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(100);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errors = {
      albumName: albumName.trim() === '',
      files: files.length === 0,
      size: size === '',
      paperType: paperType === '',
      printingFormat: printingFormat === '',
      quantity: quantity <= 0,
    };

    setFormErrors(errors);
    if (Object.values(errors).some((error) => error)) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      setUploading(true);

      // คำนวณ total price
      const totalPrice = priceList[size] * quantity * files.length;

      const productData = {
        albumName,
        size,
        paperType,
        printingFormat,
        quantity: quantity * files.length,
        totalPrice,
        numberOfFiles: files.length,
      };

      // สร้าง Order
      const orderResponse = await fetch('/api/add-product-to-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const orderData = await orderResponse.json();
      const productId = orderData.productId;

      // Upload files
      const uploadResult = await uploadFiles(productId);

      // Update URL สินค้าใน database
      const updateUrlResponse = await fetch('/api/add-product-to-cart/update-url', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          url: uploadResult
        }),
      });

      if (!updateUrlResponse.ok) {
        const errorData = await updateUrlResponse.json();
        throw new Error(errorData.message || 'Failed to update product URL');
      }

      alert('Order created and files uploaded successfully!');

      // Reset form แล้วไปหน้า my cart
      setAlbumName('');
      setFiles([]);
      setSize('');
      setPaperType('');
      setPrintingFormat('');
      setQuantity(0);
      setUploadProgress(0);

      router.push('/my-cart');

    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      alert(`Failed to process order: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const FilePreview = () => (
      <div className="grid grid-cols-5 gap-1 mt-2">
        {files.map((file, index) => (
            <div key={index} className="relative group">
              <div className="relative w-24 h-24">
                <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover rounded-md"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-md">
              <span className="text-white font-bold text-lg">
                {index + 1}
              </span>
                </div>
              </div>
            </div>
        ))}
      </div>
  );

  return (
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
        <div className="flex flex-col items-left bg-white px-[50px] py-[40px] gap-7 w-[814px] h-fit rounded-[20px]">
          <div className="flex flex-col mb-3">
            <label className="text-[20px] font-bold mb-2">Album name:</label>
            <input
                className={`p-2 text-base border ${formErrors.albumName ? 'border-red-500' : 'border-black'} rounded-md`}
                type="text"
                value={albumName}
                onChange={(e) => setAlbumName(e.target.value)}
            />
            {formErrors.albumName && (
                <span className="text-xs text-red-500 mt-1">
              * Please enter the album name
            </span>
            )}
          </div>

          {/* Upload file */}
          <div className="flex flex-col mb-3">
            <label className="text-[20px] font-bold mb-2">Upload file:</label>
            <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className={`p-2 text-base border ${formErrors.files ? 'border-red-500' : 'border-black'} rounded-md`}
            />
            {files.length > 0 && <FilePreview />}
            {formErrors.files && (
                <span className="text-xs text-red-500 mt-1">
              * Please upload at least one image
            </span>
            )}
          </div>

          <div className="flex flex-col mb-3">
            <label className="text-[20px] font-bold mb-2">Size:</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className={`p-2 text-base border ${formErrors.size ? 'border-red-500' : 'border-black'} rounded-md w-[150px]`}
            >
              <option value="">Select size</option>
              {Object.keys(priceList).map((sizeOption) => (
                <option key={sizeOption} value={sizeOption}>
                  {sizeOption}
                </option>
              ))}
            </select>
            {formErrors.size && (
                <span className="text-xs text-red-500 mt-1">
              * Please select a size
            </span>
            )}
          </div>

          <div className="flex flex-col mb-3">
            <label className="text-[20px] font-bold mb-2">Paper type:</label>
            <div className="flex gap-3.5">
              <button
                  type="button"
                  className={`py-2 px-4 rounded-[10px] ${paperType === 'matte' ? 'bg-black text-white text-[18px] font-bold' : 'bg-gray-200 text-[18px]'}`}
                  onClick={() => setPaperType('matte')}
              >
                Matte
              </button>
              <button
                  type="button"
                  className={`py-2 px-4 rounded-[10px] ${paperType === 'glossy' ? 'bg-black text-white text-[18px] font-bold' : 'bg-gray-200 text-[18px]'}`}
                  onClick={() => setPaperType('glossy')}
              >
                Glossy
              </button>
            </div>
            {formErrors.paperType && (
                <span className="text-xs text-red-500 mt-1">
              * Please select a paper type
            </span>
            )}
          </div>

          <div className="flex flex-col mb-3">
            <label className="text-[20px] font-bold mb-2">Printing format:</label>
            <div className="flex gap-3.5">
              <button
                  type="button"
                  className={`py-2 px-4 rounded-[10px] ${printingFormat === 'full page' ? 'bg-black text-white text-[18px] font-bold' : 'bg-gray-200 text-[18px]'}`}
                  onClick={() => setPrintingFormat('full page')}
              >
                Full page
              </button>
              <button
                  type="button"
                  className={`py-2 px-4 rounded-[10px] ${printingFormat === 'full file' ? 'bg-black text-white text-[18px] font-bold' : 'bg-gray-200 text-[18px]'}`}
                  onClick={() => setPrintingFormat('full file')}
              >
                Full file
              </button>
              <button
                  type="button"
                  className={`py-2 px-4 rounded-[10px] ${printingFormat === 'white border' ? 'bg-black text-white text-[18px] font-bold' : 'bg-gray-200 text-[18px]'}`}
                  onClick={() => setPrintingFormat('white border')}
              >
                White border
              </button>
            </div>
            {formErrors.printingFormat && (
                <span className="text-xs text-red-500 mt-1">
              * Please select a printing format
            </span>
            )}
          </div>

          <div className="flex flex-col mb-3">
            <label className="text-[20px] font-bold mb-2">Quantity per file:</label>
            <input
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              min={1}
              className={`p-2 text-base border ${formErrors.quantity ? 'border-red-500' : 'border-black'} rounded-md w-[150px]`}
            />
            {formErrors.quantity && (
                <span className="text-xs text-red-500 mt-1">
              * Please enter a valid quantity
            </span>
            )}
          </div>

          <div className="flex justify-end items-center mb-2">
            <label className="text-[20px] font-bold mr-3">Total price:</label>
            <p className="text-[20px] font-bold text-red-500">
              {quantity > 0 && size ? calculatePrice(size, quantity) * files.length : 0} Baht
            </p>
          </div>

          {uploading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                    className="bg-black h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
          )}

          <div className="flex justify-end w-full mt-[-20px]">
            <button
                type="submit"
                disabled={uploading}
                className={`flex justify-center items-center px-6 py-3 bg-black text-white text-[20px] font-bold rounded-md ${
                    uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'
                }`}
            >
              {uploading ? 'Uploading...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </form>
  );
};

export default OrderForm;