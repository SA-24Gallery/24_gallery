"use client"

import React, { useState, useEffect } from 'react';
import SortButton from './sort-button'; // Import the SortButton
import { notFound } from 'next/navigation';

// Define the order data type
interface Order {
  orderId: string;
  customer: string;
  email: string;
  delivery: string;
  dateOrdered: string;
  dateReceived: string;
  status: string;
}

export function ManageOrders() {
  const [sortCriteria, setSortCriteria] = useState('orderId'); // Default sorting by orderId
  const [orders, setOrders] = useState<Order[]>([]); // State to hold the fetched orders with proper typing
  const [loading, setLoading] = useState(true); // State to show a loading spinner or message
  const [error, setError] = useState<string | null>(null); // Error state to catch any errors
  const [searchTerm, setSearchTerm] = useState(''); // State to manage search

  // Fetch the orders from the API route when the component mounts
  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch('/api/orders'); // Call the API route
        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.statusText}`);
        }
        const data: Order[] = await response.json(); // Parse the JSON response
        setOrders(data); // Set the fetched orders
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        setError(error.message); // Set the error message
      } finally {
        setLoading(false); // Stop the loading spinner once data is fetched
      }
    }

    fetchOrders();
  }, []);

  // Function to filter the orders based on search input
  const filteredOrders = orders.filter(order =>
    order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to sort the orders based on the selected criteria
  const sortOrders = (a: Order, b: Order) => {
    if (sortCriteria === 'orderId') {
      return a.orderId.localeCompare(b.orderId);
    } else if (sortCriteria === 'dateOrdered') {
      return new Date(a.dateOrdered).getTime() - new Date(b.dateOrdered).getTime();
    } else if (sortCriteria === 'dateReceived') {
      return new Date(a.dateReceived).getTime() - new Date(b.dateReceived).getTime();
    }
    return 0;
  };

  const sortedOrders = [...filteredOrders].sort(sortOrders);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="ml-4 text-lg text-gray-600">Loading orders...</span>
      </div>
    );
  }

  if (error) {
    notFound(); // Display the error page if there's an error
  }

  return (
    <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg">
      {/* Search and Buttons */}
      <div className="flex justify-between items-center mb-6">
        <div className="w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for Order ID, Email, or Customer..."
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="ml-4 flex items-center space-x-4">
          <SortButton onSort={(criteria) => setSortCriteria(criteria)} />  {/* Pass sorting callback */}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-lg shadow-sm">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID#
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delivery Option
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Ordered
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Received
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedOrders.map((order, index) => (
              <tr key={index} className="hover:bg-gray-100">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.orderId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.delivery}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.dateOrdered}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.dateReceived}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ManageOrders;