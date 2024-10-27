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
  const router = useRouter(); 

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch('api/orders/order-list');
        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.statusText}`);
        }
        const data: Order[] = await response.json();
        const latestOrders = deduplicateOrders(data); // Deduplicate orders
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

  // Deduplication logic to get the latest status for each order
  const deduplicateOrders = (orders: Order[]): Order[] => {
    const orderMap: { [orderId: string]: Order } = {};

    orders.forEach(order => {
      // If the order ID doesn't exist in the map or if the current statusDate is more recent, update the map
      if (!orderMap[order.orderId] || new Date(order.statusDate) > new Date(orderMap[order.orderId].statusDate)) {
        orderMap[order.orderId] = order;
      }
    });

    return Object.values(orderMap); // Return only unique orders
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
    } else if (order.paymentStatus === 'A') {
      return order.status;
    } else if (order.paymentStatus === 'P') {
      return "Pending";
    } 
    return 'Unknown Status';
  };

  if (loading) {
    return <div>Loading your orders...</div>;
  }

  if (error) {
    return <div>Error fetching your orders: {error}</div>;
  }

  const filteredOrders = orders
    .filter(order => order.orderId.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort(sortOrders);

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
            {filteredOrders.map((order, index) => (
              <tr
                key={index}
                className="hover:bg-gray-100 cursor-pointer"
                onClick={() => handleRowClick(order.orderId)}
              >
                <td className="px-6 py-4">{order.orderId}</td>
                <td className="px-6 py-4">
                  {order.paymentStatus === 'A' ? new Date(order.dateOrdered).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4">
                  {order.paymentStatus === 'A' ? new Date(order.dateReceived).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4">{getShippingOptionDisplay(order.shippingOption)}</td>
                <td className="px-6 py-4">{getStatusDisplay(order)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MyOrdersList;
