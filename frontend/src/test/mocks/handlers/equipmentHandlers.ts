import { http, HttpResponse } from 'msw';
import { apiUrl } from '../../testApiBase';

const mockEquipment = {
  id: 'eq-1',
  storeId: '1',
  equipmentName: 'Main Oven',
  type: 'OVEN',
  status: 'AVAILABLE',
  isOn: false,
  usageCount: 120,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-15T00:00:00Z',
};

export const equipmentHandlers = [
  http.get(apiUrl('/equipment'), () => HttpResponse.json([mockEquipment])),
  http.get(apiUrl('/equipment/:id'), () => HttpResponse.json(mockEquipment)),
  http.post(apiUrl('/equipment'), () => HttpResponse.json(mockEquipment)),
  http.patch(apiUrl('/equipment/:id'), () => HttpResponse.json(mockEquipment)),
];