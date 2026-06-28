import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import type { RootState } from '../../store/store';
import type { Order } from '../../store/api/orderApi';
import type { MenuItem } from '../../store/api/menuApi';
import type { POSOrderItem } from '../POSSystem/types';
import type { DriverDeliveryOrder } from '../DriverApp/types';

export type MockButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { children?: ReactNode };
export type MockDivProps = HTMLAttributes<HTMLDivElement> & { children?: ReactNode };

export type TestPreloadedState = {
  [K in keyof RootState]?: RootState[K] extends object ? Partial<RootState[K]> : RootState[K];
};

export type RtkMiddleware = (next: (action: unknown) => unknown) => (action: unknown) => unknown;

export type { Order, MenuItem, POSOrderItem, DriverDeliveryOrder };