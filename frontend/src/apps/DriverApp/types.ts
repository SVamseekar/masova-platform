import type { DeliveryAddress, Order, OrderItem } from '../../store/api/orderApi';

export interface DriverAssignedDriver {
  id: string;
  name?: string;
}

export interface DriverCustomer {
  name?: string;
  phone?: string;
  address?: DeliveryAddress | string;
}

export interface DriverDeliveryOrder extends Order {
  assignedDriver?: DriverAssignedDriver | string;
  customer?: DriverCustomer;
  _id?: string;
}

export type { OrderItem, DeliveryAddress };

export interface TabSyncDriverStatusData {
  userId: string;
  isOnline: boolean;
}

export interface TabSyncGPSLocationData {
  latitude: number;
  longitude: number;
}

export interface TabSyncSessionData {
  sessionId?: string;
  startTime?: string;
}

export type TabSyncDataMap = {
  DRIVER_STATUS_CHANGE: TabSyncDriverStatusData;
  GPS_LOCATION_UPDATE: TabSyncGPSLocationData;
  SESSION_CHANGE: TabSyncSessionData;
};

export type TabSyncEventType = keyof TabSyncDataMap;