"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';

interface Order {
  orderId: string;
  customer: string;
  email: string;
  shippingOption: string;
  dateOrdered: string;
  dateReceived: string;
  status: string;
  paymentStatus: string;
}

export function ManageOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filter, setFilter] = useState<string>('');
  const [sortField, setSortField] = useState<string>('orderId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 20;
  
  const router = useRouter();

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch(`/api/status${filter ? `?filter=${filter}` : ''}`);
        if (!response.ok) {
          if (response.status === 404) {
            setOrders([]);
            return;
          }
          throw new Error(`Failed to fetch orders: ${response.statusText}`);
        }
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (error: any) {
        console.error('Fetch error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [filter]);

  // Reset to first page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter, dateRange]);

  const handleRowClick = (orderId: string) => {
    router.push(`/manage-order-details?orderId=${orderId}`);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value);
    setLoading(true);
  };

  const handleSort = (field: string) => {
    const newSortOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
  };

  const getShippingOptionDisplay = (option: string) => {
    if (option === 'D') return 'Delivery';
    if (option === 'P') return 'Pick Up';
    return 'Unknown';
  };

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };


  const sortedOrders = [...orders].sort((a, b) => {
    const valueA = a[sortField as keyof Order];
    const valueB = b[sortField as keyof Order];

    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortOrder === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    } else if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    } else {
      return 0;
    }
  });


  const filteredOrders = sortedOrders.filter((order) => {
    const isMatchSearchTerm =
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase());

    const isInDateRange = dateRange.from && dateRange.to
      ? new Date(order.dateOrdered) >= dateRange.from && new Date(order.dateOrdered) <= dateRange.to
      : dateRange.from
      ? new Date(order.dateOrdered).toDateString() === new Date(dateRange.from).toDateString()
      : true;

    return isMatchSearchTerm && isInDateRange;
  });

  // Pagination calculations
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const Pagination = () => {
    return (
      <div className="flex justify-center items-center gap-4 mt-6 mb-4">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-md ${
            currentPage === 1
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          Previous
        </button>
        
        <span className="text-gray-600">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
          className={`px-4 py-2 rounded-md ${
            currentPage === totalPages || totalPages === 0
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          Next
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="text-lg text-gray-600">Loading orders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <div className="w-[70%]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for Order ID, Email, or Customer..."
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="ml-4">
          <select
            value={filter}
            onChange={handleFilterChange}
            className="p-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Orders</option>
            <option value="not-approve">Payment Not Approved</option>
            <option value="payment-pending">Payment Pending</option>
            <option value="waiting-process">Waiting for Process</option>
            <option value="receive-order">Receive Order</option>
            <option value="order-completed">Order Completed</option>
            <option value="shipped">Shipped</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      <DatePickerWithRange
        className="mb-6"
        onSelect={(range: { from: Date | null; to: Date | null }) => setDateRange(range)}
      />

      {filteredOrders.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No orders found
        </div>
      ) : (
        <>
          <div className="overflow-auto rounded-lg shadow-sm">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('orderId')}>
                    Order ID {sortField === 'orderId' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('customer')}>
                    Customer {sortField === 'customer' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('email')}>
                    Email {sortField === 'email' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="px-6 py-3 text-left">Delivery Option</th>
                  <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('dateOrdered')}>
                    Date Ordered {sortField === 'dateOrdered' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('dateReceived')}>
                    Date Received {sortField === 'dateReceived' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="px-6 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentOrders.map((order, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-100 cursor-pointer transition-colors duration-150"
                    onClick={() => handleRowClick(order.orderId)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.orderId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getShippingOptionDisplay(order.shippingOption)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(order.dateOrdered)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(order.dateReceived)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.paymentStatus === 'N' ? (
                        <span className="text-sm">Payment Not Approved</span>
                      ) : order.paymentStatus === 'P' ? (
                        <span className="text-sm">Pending</span>
                      ) : (
                        order.status
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Showing entries info */}
          <div className="mt-4 text-gray-600 text-sm">
            Showing {indexOfFirstOrder + 1} to {Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length} orders
          </div>

          {/* Pagination */}
          <Pagination />
        </>
      )}
    </div>
  );
}

export default ManageOrders;
