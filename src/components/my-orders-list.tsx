"use client";

import React, { useState, useEffect } from 'react';

interface Order {
  orderId: string;
  customer: string;
  email: string;
  delivery: string; 
  dateOrdered: string;
  dateReceived: string;
  status: string; 
  statusDate: string; 
}

export function MyOrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'orderId' | 'dateOrdered' | 'dateReceived'>('orderId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Default ascending sort

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch('/api/orders'); 
        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.statusText}`);
        }
        const data: Order[] = await response.json();

        const latestOrders = getLatestOrders(data);
        setOrders(latestOrders);
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  const getLatestOrders = (orders: Order[]) => {
    const orderMap: { [key: string]: Order } = {};

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

  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return dateString;
    }
  };

  if (loading) {
    return <div>Loading your orders...</div>;
  }

  if (error) {
    return <div>Error fetching your orders: {error}</div>;
  }

  const filteredOrders = orders
    .filter(order =>
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort(sortOrders); 

  return (
    <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg">
      {/* Search Box */}
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by Order ID..."
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Orders Table */}
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
              <th className="px-6 py-3 text-left">Delivery Option</th> {/* Delivery Column */}
              <th className="px-6 py-3 text-left">Status</th> {/* Status Column */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order, index) => (
              <tr key={index} className="hover:bg-gray-100">
                <td className="px-6 py-4">{order.orderId}</td>
                <td className="px-6 py-4">{formatDate(order.dateOrdered)}</td>
                <td className="px-6 py-4">{formatDate(order.dateReceived)}</td>
                <td className="px-6 py-4">{order.delivery}</td> {/* Display delivery option */}
                <td className="px-6 py-4">{order.status}</td> {/* Display status */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MyOrdersList;
