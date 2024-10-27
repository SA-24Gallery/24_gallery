"use client";

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

interface Order {
  orderId: string;
  customer: string;
  email: string;
  shippingOption: string;
  dateOrdered: string;
  dateReceived: string;
  paymentStatus: string;
  status: string;
  statusDate: string;
}

export function MyOrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'orderId' | 'dateOrdered' | 'dateReceived'>('orderId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 20;

  const router = useRouter();

  const fetchOrders = async () => {
    try {
      const response = await fetch('api/orders');
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }
      const data: Order[] = await response.json();
      const latestOrders = deduplicateOrders(data);
      setOrders(latestOrders);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const deduplicateOrders = (orders: Order[]): Order[] => {
    const orderMap: { [orderId: string]: Order } = {};

    orders.forEach(order => {
      if (!orderMap[order.orderId] || new Date(order.statusDate) > new Date(orderMap[order.orderId].statusDate)) {
        orderMap[order.orderId] = order;
      }
    });

    return Object.values(orderMap);
  };

  const handleSort = (field: 'orderId' | 'dateOrdered' | 'dateReceived') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortOrders = (a: Order, b: Order) => {
    let comparison = 0;

    if (sortField === 'orderId') {
      comparison = a.orderId.localeCompare(b.orderId);
    } else if (sortField === 'dateOrdered') {
      comparison = new Date(a.dateOrdered).getTime() - new Date(b.dateOrdered).getTime();
    } else if (sortField === 'dateReceived') {
      comparison = new Date(a.dateReceived).getTime() - new Date(b.dateReceived).getTime();
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  };

  const handleRowClick = (orderId: string) => {
    router.push(`/my-order-details?orderId=${orderId}`);
  };

  const getShippingOptionDisplay = (option: string) => {
    if (option === 'D') return 'Delivery';
    if (option === 'P') return 'Pick Up';
    return 'Unknown';
  };

  const getStatusDisplay = (order: Order) => {
    if (order.paymentStatus === 'N') {
      return 'Payment Not Approved';
    } else if (order.paymentStatus === 'P') {
      return 'Payment Pending';
    } else if (order.paymentStatus === 'A') {
      if (order.status === 'Order completed') {
        return 'Order completed';
      } else if (order.status === 'Receive order') {
        return 'Receive order';
      } else if (order.status === 'Shipped') {
        return 'Shipped';
      } else if (order.status === 'Canceled') {
        return 'Canceled';
      } else if (!order.status || order.status.trim() === '' || order.status === '0') {
        return 'Waiting for process';
      }
      return order.status;
    }
    return 'Unknown Status';
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Pagination component
  const Pagination = () => {
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

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
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="text-lg text-gray-600">Loading your orders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-red-500">Error fetching your orders: {error}</div>
      </div>
    );
  }

  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => order.orderId.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort(sortOrders);

  // Pagination calculations
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  return (
    <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg">
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by Order ID..."
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

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
                  <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('dateOrdered')}>
                    Date Ordered {sortField === 'dateOrdered' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('dateReceived')}>
                    Date Received {sortField === 'dateReceived' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="px-6 py-3 text-left">Delivery Option</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(order.dateOrdered)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.paymentStatus === 'A' ? formatDate(order.dateReceived) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getShippingOptionDisplay(order.shippingOption)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getStatusDisplay(order)}
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

          {/* Show pagination only if needed */}
          {filteredOrders.length > ordersPerPage && <Pagination />}
        </>
      )}
    </div>
  );
}

export default MyOrdersList;