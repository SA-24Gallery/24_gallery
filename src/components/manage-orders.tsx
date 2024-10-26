"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SortButton from './sort-button';
import { notFound } from 'next/navigation';

interface Order {
  orderId: string;
  customer: string;
  email: string;
  shippingOption: string;
  dateOrdered: string;
  dateReceived: string;
  status: string;
}

export function ManageOrders() {
  const [sortCriteria, setSortCriteria] = useState('orderId');
  const [sortOrder, setSortOrder] = useState('asc');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.statusText}`);
        }
        const data: Order[] = await response.json();
        setOrders(data);
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  const uniqueOrders = (orders: Order[]): Order[] => {
    const seen = new Set();
    return orders.filter(order => {
      if (seen.has(order.orderId)) {
        return false;
      }
      seen.add(order.orderId);
      return true;
    });
  };

  const filteredOrders = uniqueOrders(orders).filter(order =>
    order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortOrders = (a: Order, b: Order) => {
    let comparison = 0;

    if (sortCriteria === 'orderId') {
      comparison = a.orderId.localeCompare(b.orderId);
    } else if (sortCriteria === 'dateOrdered') {
      comparison = new Date(a.dateOrdered).getTime() - new Date(b.dateOrdered).getTime();
    } else if (sortCriteria === 'dateReceived') {
      comparison = new Date(a.dateReceived).getTime() - new Date(b.dateReceived).getTime();
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  };

  const sortedOrders = [...filteredOrders].sort(sortOrders);

  const handleRowClick = (orderId: string) => {
    router.push(`/manage-order-details?orderId=${orderId}`);
  };

  const getShippingOptionDisplay = (option: string) => {
    if (option === 'D') return 'Delivery';
    if (option === 'P') return 'Pick Up';
    return 'Unknown';
  };

  const formatDateTime = (dateString: string): string => {
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
      <div className="flex justify-between items-center mb-6">
        <div className="w-[1316px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for Order ID, Email, or Customer..."
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="ml-4 flex items-center space-x-4">
          <SortButton onSort={(criteria, order) => { setSortCriteria(criteria); setSortOrder(order); }} />  {/* Pass sorting callback */}
        </div>
      </div>

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
              <tr
                key={index}
                className="hover:bg-gray-100 cursor-pointer transition-colors duration-150"
                onClick={() => handleRowClick(order.orderId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRowClick(order.orderId);
                  }
                }}
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