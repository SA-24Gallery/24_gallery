"use client";

import React, { useState } from 'react';

const OrderForm = () => {
  const [order, setOrder] = useState<{
    order_id: string;
    customer_name: string;
    email: string;
    products: any[];
  } | null>(null);

  const [albumName, setAlbumName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [size, setSize] = useState('');
  const [paperType, setPaperType] = useState('');
  const [printingFormat, setPrintingFormat] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
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
    '4 x 6 (1-2 ใบ)': 20,
    '4 x 6 (3-19 ใบ)': 10,
    '4 x 6 (20 ใบขึ้นไป)': 4,
    '5 x 7': 25,
    '6 x 8': 30,
    '8 x 10': 60,
    '8 x 12': 60,
    '10 x 15': 180,
    '12 x 18': 250,
    '16 x 20': 300,
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const uploadFiles = async (): Promise<string[]> => {
    setUploading(true);
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          // Upload the file directly
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('File upload failed');
          }

          const { url } = await response.json();
          return url;
        })
      );
      setUploadedUrls(urls);
      return urls;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    } finally {
      setUploading(false);
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
      const fileUrls = await uploadFiles();
      const userEmail = 'user@example.com'; // Replace this with actual user email retrieval logic

      const product = {
        Size: size,
        Paper_type: paperType,
        Product_qty: quantity,
        Printing_format: printingFormat,
        Price: priceList[size] * quantity,
        Album_name: albumName,
        Url: fileUrls,
      };

      setOrder((prevOrder) => {
        if (prevOrder) {
          return {
            ...prevOrder,
            products: [...prevOrder.products, product],
          };
        } else {
          return {
            order_id: '12345', // Generate a unique ID or fetch it dynamically
            customer_name: 'Carina Ningning',
            email: userEmail,
            products: [product],
          };
        }
      });

      alert('Product added to the order successfully!');

      // Reset form fields
      setAlbumName('');
      setFiles([]);
      setUploadedUrls([]);
      setSize('');
      setPaperType('');
      setPrintingFormat('');
      setQuantity(0);

    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      alert(`Failed to add product: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
      <div className="flex flex-col items-left bg-white px-[50px] py-[40px] gap-7 w-[814px] h-fit rounded-[20px]">
        {/* Album name */}
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
            onChange={handleFileUpload}
            className={`p-2 text-base border ${formErrors.files ? 'border-red-500' : 'border-black'} rounded-md`}
          />
          {formErrors.files && (
            <span className="text-xs text-red-500 mt-1">
              * Please upload at least one image
            </span>
          )}
        </div>

        {/* Size selection */}
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

        {/* Paper type selection */}
        <div className="flex flex-col mb-3">
          <label className="text-[20px] font-bold mb-2">Paper type:</label>
          <div className="flex gap-2">
            <button
              type="button"
              className={`p-2 rounded-md ${paperType === 'matte' ? 'bg-black text-white text-[16px] font-bold' : 'bg-gray-200'}`}
              onClick={() => setPaperType('matte')}
            >
              Matte
            </button>
            <button
              type="button"
              className={`p-2 rounded-md ${paperType === 'glossy' ? 'bg-black text-white text-[16px] font-bold' : 'bg-gray-200'}`}
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

        {/* Printing format selection */}
        <div className="flex flex-col mb-3">
          <label className="text-[20px] font-bold mb-2">Printing format:</label>
          <div className="flex gap-2">
            <button
              type="button"
              className={`p-2 rounded-md ${printingFormat === 'full page' ? 'bg-black text-white text-[16px] font-bold' : 'bg-gray-200'}`}
              onClick={() => setPrintingFormat('full page')}
            >
              Full page
            </button>
            <button
              type="button"
              className={`p-2 rounded-md ${printingFormat === 'full file' ? 'bg-black text-white text-[16px] font-bold' : 'bg-gray-200'}`}
              onClick={() => setPrintingFormat('full file')}
            >
              Full file
            </button>
            <button
              type="button"
              className={`p-2 rounded-md ${printingFormat === 'white border' ? 'bg-black text-white text-[16px] font-bold' : 'bg-gray-200'}`}
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

        {/* Quantity per file */}
        <div className="flex flex-col mb-3">
          <label className="text-[20px] font-bold mb-2">Quantity per file:</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            min={1}
            className={`p-2 text-base border ${formErrors.quantity ? 'border-red-500' : 'border-black'} rounded-md w-[150px]`}
          />
          {formErrors.quantity && (
            <span className="text-xs text-red-500 mt-1">
              * Please enter a valid quantity
            </span>
          )}
        </div>

        {/* Total price display */}
        <div className="flex justify-end items-center mb-2">
          <label className="text-[20px] font-bold mr-3">Total price:</label>
          <p className="text-[20px] font-bold text-red-500">{priceList[size] && quantity > 0 ? priceList[size] * quantity * files.length : 0} Baht</p>
        </div>

        {/* Submit button */}
        <div className="flex justify-end w-full mt-[-20px]">
          <button
            type="submit"
            disabled={uploading}
            className={`flex justify-center items-center px-6 py-3 bg-black text-white text-[20px] font-bold rounded-md ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'}`}
          >
            {uploading ? 'Submitting...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default OrderForm;
