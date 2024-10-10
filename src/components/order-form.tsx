"use client";
import React, { useState, useEffect } from 'react';

const OrderForm = () => {
  const [albumName, setAlbumName] = useState('');
  const [files, setFiles] = useState<File[]>([]); // Store multiple files
  const [size, setSize] = useState('');
  const [paperType, setPaperType] = useState('');
  const [printingFormat, setPrintingFormat] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [formErrors, setFormErrors] = useState({
    albumName: false,
    files: false,
    size: false,
    paperType: false,
    printingFormat: false,
    quantity: false,
  });

  // Price list for different sizes
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

  // Calculate the total price when the size, quantity, or files change
  useEffect(() => {
    if (size && quantity > 0 && files.length > 0) {
      const unitPrice = priceList[size] || 0;
      setTotalPrice(unitPrice * quantity * files.length); // Multiply by number of files
    }
  }, [size, quantity, files]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files)); // Update to store multiple files
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent the form from refreshing the page

    const errors = {
      albumName: albumName === '',
      files: files.length === 0,
      size: size === '',
      paperType: paperType === '',
      printingFormat: printingFormat === '',
      quantity: quantity === 0,
    };

    setFormErrors(errors);
    const hasErrors = Object.values(errors).some((error) => error);
    if (hasErrors) {
      alert('Please fill in all required fields.');
      return;
    }

    const newOrder = {
      albumName,
      files,
      size,
      paperType,
      printingFormat,
      quantity,
      totalPrice,
    };

    // Get previous orders from localStorage and add the new one
    const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updatedOrders = [...existingOrders, newOrder];

    // Save back to localStorage
    localStorage.setItem('orders', JSON.stringify(updatedOrders));

    alert('Item added to cart!');
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
        <div className="flex flex-col items-left bg-white px-[50px] py-[40px] gap-7 w-[814px] h-fit rounded-[20px]">
          {/* Album name */}
          <div className="flex flex-col mb-3">
            <label className="text-[20px] font-bold mb-2">Album name:</label>
            <input
              className="p-2 text-base border border-black rounded-md"
              type="text"
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
            />
            {formErrors.albumName && (
              <span className="text-xs text-red-500 mt-1">
                * Please fill in the required info
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
              className="p-2 text-base border border-black rounded-md"
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
              className="p-2 text-base border border-black rounded-md w-[150px]"
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
                * Please select the required info
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
                * Please select the required info
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
                * Please select the required info
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
              className="p-2 text-base border border-black rounded-md w-[150px]"
            />
            {formErrors.quantity && (
              <span className="text-xs text-red-500 mt-1">
                * Please fill in the required info
              </span>
            )}
          </div>

          {/* Total price */}
          <div className="flex justify-end items-center mb-2">
            <label className="text-[20px] font-bold mr-3">Total price:</label>
            <p className="text-[20px] font-bold text-red-500">{totalPrice} Baht</p>
          </div>

          {/* Add to Cart button */}
          <div className="flex justify-end w-full mt-[-20px]">
            <button
              type="submit" // Submit the form here
              className="flex justify-center items-center px-6 py-3 bg-black text-white text-[20px] font-bold rounded-md"
            >
              Add to cart
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default OrderForm;