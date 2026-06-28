import type { DeliveryAddress, Order } from '../../../store/api/orderApi';
import type { DriverDeliveryOrder } from '../types';

export function formatDeliveryAddress(
  address: DeliveryAddress | string | undefined
): string {
  if (!address) {
    return 'N/A';
  }
  if (typeof address === 'string') {
    return address;
  }
  const parts = [address.street, address.city, address.pincode].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'N/A';
}

export function toDriverDeliveryOrder(order: Order): DriverDeliveryOrder {
  return {
    ...order,
    assignedDriver: order.assignedDriverId ?? order.driverId,
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      address: order.deliveryAddress,
    },
  };
}

export function toDriverDeliveryOrders(orders: Order[] | undefined): DriverDeliveryOrder[] {
  return (orders ?? []).map(toDriverDeliveryOrder);
}

export function getAssignedDriverId(order: DriverDeliveryOrder): string | undefined {
  if (typeof order.assignedDriver === 'string') {
    return order.assignedDriver;
  }
  return order.assignedDriver?.id ?? order.assignedDriverId ?? order.driverId;
}

export function getOrderId(order: DriverDeliveryOrder): string {
  return order.id || order._id || '';
}

export function getOrderTotal(order: DriverDeliveryOrder): number {
  return order.totalAmount ?? order.total;
}

export function getOrderDisplayNumber(order: DriverDeliveryOrder): string {
  const id = getOrderId(order);
  return order.orderNumber || id.slice(-6).toUpperCase();
}