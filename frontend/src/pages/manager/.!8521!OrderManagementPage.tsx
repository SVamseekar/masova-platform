import React, { useState } from 'react';
import AppHeader from '../../components/common/AppHeader';
import OrderForm from '../../components/forms/OrderForm';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useGetStoreOrdersQuery,
  useUpdateOrderStatusMutation,
  useUpdateOrderPriorityMutation,
  useCancelOrderMutation,
  useAssignDriverMutation,
  Order,
} from '../../store/api/orderApi';
import { useGetUsersQuery } from '../../store/api/userApi';
import { ORDER_STATUS_CONFIG, ORDER_TYPE_CONFIG, PAYMENT_STATUS_CONFIG } from '../../types/order';
import type { OrderStatus, OrderPriority } from '../../types/order';

const OrderManagementPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const storeId = currentUser?.storeId || '';

  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');

  // API hooks
  const { data: orders = [], isLoading, refetch } = useGetStoreOrdersQuery(storeId, {
    skip: !storeId,
    pollingInterval: 10000, // Poll every 10 seconds
  });

  const { data: users = [] } = useGetUsersQuery({});
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [updateOrderPriority] = useUpdateOrderPriorityMutation();
  const [cancelOrder] = useCancelOrderMutation();
  const [assignDriver] = useAssignDriverMutation();

  // Get drivers
  const drivers = users.filter(user => user.type === 'DRIVER');

  // Filter orders by status
  const filteredOrders = statusFilter === 'ALL'
    ? orders
    : orders.filter(order => order.status === statusFilter);

  // Sort orders: urgent first, then by creation time
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
    if (b.priority === 'URGENT' && a.priority !== 'URGENT') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Calculate statistics
  const stats = {
    total: orders.length,
    active: orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
    cancelled: orders.filter(o => o.status === 'CANCELLED').length,
    revenue: orders
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + o.total, 0),
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus({ orderId, status }).unwrap();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update order status');
    }
  };

  const handlePriorityChange = async (orderId: string, priority: OrderPriority) => {
    try {
      await updateOrderPriority({ orderId, priority }).unwrap();
    } catch (error) {
      console.error('Failed to update priority:', error);
      alert('Failed to update priority');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;

    try {
      await cancelOrder({ orderId, reason }).unwrap();
      alert('Order cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('Failed to cancel order');
    }
  };

  const handleAssignDriver = async (orderId: string) => {
    if (drivers.length === 0) {
      alert('No drivers available');
      return;
    }

    const driverList = drivers.map((d, i) => `${i + 1}. ${d.name} (${d.id})`).join('\n');
    const selection = prompt(`Select driver:\n${driverList}\n\nEnter driver number:`);

    if (!selection) return;

    const driverIndex = parseInt(selection) - 1;
    if (driverIndex < 0 || driverIndex >= drivers.length) {
      alert('Invalid selection');
      return;
    }

    try {
      await assignDriver({ orderId, driverId: drivers[driverIndex].id }).unwrap();
      alert('Driver assigned successfully');
    } catch (error) {
      console.error('Failed to assign driver:', error);
      alert('Failed to assign driver');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
