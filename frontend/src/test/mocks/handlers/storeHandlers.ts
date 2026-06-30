import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';

const mockStore = {
  id: 'store-1',
  name: 'MaSoVa Downtown',
  storeCode: '1',
  status: 'ACTIVE',
  address: {
    street: '123 Main St',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500001',
  },
  operatingConfig: {
    weeklySchedule: {},
    acceptsOnlineOrders: true,
  },
};

export const storeHandlers = [
  http.get(apiUrl('/stores'), () => HttpResponse.json([mockStore])),
  http.post(apiUrl('/stores'), () => HttpResponse.json(mockStore)),
  http.get(apiUrl('/stores/:storeId'), ({ params }) =>
    HttpResponse.json({ ...mockStore, id: params.storeId, storeCode: String(params.storeId) }),
  ),
];