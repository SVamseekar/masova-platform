import { authHandlers } from './authHandlers';
import { menuHandlers } from './menuHandlers';
import { orderHandlers } from './orderHandlers';
import { deliveryHandlers } from './deliveryHandlers';
import { userHandlers } from './userHandlers';
import { customerHandlers } from './customerHandlers';
import { paymentHandlers } from './paymentHandlers';
import { inventoryHandlers } from './inventoryHandlers';
import { analyticsHandlers } from './analyticsHandlers';
import { notificationHandlers } from './notificationHandlers';
import { reviewHandlers } from './reviewHandlers';
import { sessionHandlers } from './sessionHandlers';
import { equipmentHandlers } from './equipmentHandlers';
import { shiftHandlers } from './shiftHandlers';
import { gdprHandlers } from './gdprHandlers';
import { earningsHandlers } from './earningsHandlers';
import { tipHandlers } from './tipHandlers';
import { systemHandlers } from './systemHandlers';
import { storeHandlers } from './storeHandlers';
import { aggregatorHandlers } from './aggregatorHandlers';
import { fiscalHandlers } from './fiscalHandlers';

export const allHandlers = [
  ...authHandlers,
  ...menuHandlers,
  ...orderHandlers,
  ...deliveryHandlers,
  ...userHandlers,
  ...customerHandlers,
  ...paymentHandlers,
  ...inventoryHandlers,
  ...analyticsHandlers,
  ...notificationHandlers,
  ...reviewHandlers,
  ...sessionHandlers,
  ...equipmentHandlers,
  ...shiftHandlers,
  ...gdprHandlers,
  ...earningsHandlers,
  ...tipHandlers,
  ...systemHandlers,
  ...storeHandlers,
  ...aggregatorHandlers,
  ...fiscalHandlers,
];
