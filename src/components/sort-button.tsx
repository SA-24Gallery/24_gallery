"use client";

import React, { useState } from 'react';

export function SortButton({ onSort }: { onSort: (criteria: string, order: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc'); // Default sorting order is ascending

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSort = (criteria: string) => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc'; // Toggle between asc and desc
    setSortOrder(newSortOrder);
    onSort(criteria, newSortOrder); // Pass both criteria and order to the parent
    setIsOpen(false); // Close dropdown after selecting
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={toggleDropdown}
        className="bg-gray-100 rounded-lg focus:outline-none flex justify-center items-center space-x-2 w-[130px] h-[52px]"
      >
        <span className="text-sm font-medium">Sort by</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.292 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute mt-2 w-48 bg-white shadow-lg rounded-md z-10">
          <ul className="py-1">
            <li>
              <button
                onClick={() => handleSort('orderId')}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
              >
                Order ID
              </button>
            </li>
            <li>
              <button
                onClick={() => handleSort('dateOrdered')}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
              >
                Date Ordered
              </button>
            </li>
            <li>
              <button
                onClick={() => handleSort('dateReceived')}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
              >
                Date Received
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default SortButton;
