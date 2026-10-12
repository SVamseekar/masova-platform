/** Customer-facing wording and progress steps for order states, shared by the tracking and account pages. */
export type Tone = 'warning' | 'info' | 'success' | 'error';
export interface Step { label: string; statuses: string[]; note?: string }

export const KITCHEN: Step[] = [
  { label: 'Received', statuses: ['RECEIVED'] },
  { label: 'Preparing', statuses: ['PREPARING'] },
  { label: 'In oven', statuses: ['OVEN', 'BAKED'] },
  { label: 'Ready', statuses: ['READY'] },
];
const STEPS: Record<string, Step[]> = {
  DELIVERY: [...KITCHEN, { label: 'Dispatched', statuses: ['DISPATCHED'], note: 'Awaiting pickup' }, { label: 'Out for delivery', statuses: ['OUT_FOR_DELIVERY'] }, { label: 'Delivered', statuses: ['DELIVERED', 'COMPLETED'] }],
  TAKEAWAY: [...KITCHEN, { label: 'Collected', statuses: ['COMPLETED', 'DELIVERED'] }],
  DINE_IN: [...KITCHEN, { label: 'Served', statuses: ['SERVED', 'COMPLETED'] }],
};
/** Used when the public tracking view does not say how the order is fulfilled. */
const NEUTRAL_STEPS: Step[] = [...KITCHEN, { label: 'Completed', statuses: ['DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'SERVED', 'COMPLETED'] }];

const STATUS_COPY: Record<string, { chip: string; tone: Tone; title: string; text: string }> = {
  RECEIVED: { chip: 'Received', tone: 'info', title: 'Your order has been received', text: 'The kitchen will start on it shortly.' },
  PREPARING: { chip: 'Preparing', tone: 'warning', title: 'Your food is being prepared', text: 'The kitchen is working on your order.' },
  OVEN: { chip: 'In oven', tone: 'warning', title: 'Your food is in the oven', text: 'It will be ready soon.' },
  BAKED: { chip: 'In oven', tone: 'warning', title: 'Your food is out of the oven', text: 'It is being finished and packed.' },
  READY: { chip: 'Ready', tone: 'success', title: 'Your order is ready', text: 'It is packed and waiting.' },
  DISPATCHED: { chip: 'Dispatched', tone: 'info', title: 'A driver has been assigned', text: 'Your driver is collecting the order from the store.' },
  OUT_FOR_DELIVERY: { chip: 'Out for delivery', tone: 'success', title: 'Your order is on its way', text: 'Follow the driver on the live map.' },
  DELIVERED: { chip: 'Delivered', tone: 'success', title: 'Your order was delivered', text: 'Enjoy your meal.' },
  SERVED: { chip: 'Served', tone: 'success', title: 'Your order was served', text: 'Enjoy your meal.' },
  COMPLETED: { chip: 'Completed', tone: 'success', title: 'Your order is complete', text: 'Thank you for ordering with MaSoVa.' },
  CANCELLED: { chip: 'Cancelled', tone: 'error', title: 'This order was cancelled', text: 'Contact the store if you did not expect this.' },
};

export const stepsFor = (type?: string) => !type ? NEUTRAL_STEPS : type === 'DINE_IN' ? STEPS.DINE_IN : type === 'DELIVERY' ? STEPS.DELIVERY : STEPS.TAKEAWAY;

export const statusCopy = (status: string) => STATUS_COPY[status] ?? { chip: status.toLowerCase().replace(/_/g, ' '), tone: 'info' as Tone, title: 'Order status updated', text: '' };
