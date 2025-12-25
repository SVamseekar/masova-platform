export interface User {
  id: string;
  type: 'CUSTOMER' | 'STAFF' | 'DRIVER' | 'MANAGER' | 'ASSISTANT_MANAGER' | 'KIOSK';
  name: string;
  email: string;
  phone: string;
  address?: Address;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  isActive: boolean;
  storeId?: string;
  role?: string;
  permissions?: string[];
  generatedPIN?: string; // 5-digit PIN generated on employee creation (shown only once)
  userType?: 'CUSTOMER' | 'STAFF' | 'DRIVER' | 'MANAGER' | 'ASSISTANT_MANAGER'; // Deprecated, use 'type'
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

export interface WorkingSession {
  id: string;
  employeeId: string;
  storeId: string;
  name?: string;
  role?: string;
  date: string;
  loginTime: string;
  logoutTime?: string;
  totalHours?: number;
  isActive: boolean;
  breakTime: number;
  notes?: string;
  currentDuration?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PENDING_APPROVAL';
}