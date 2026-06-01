import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { DefaultTestWrapper } from '../../test/TestWrapper';
import {
  menuApi,
  useGetAvailableMenuQuery,
  useGetMenuItemQuery,
  useGetMenuByCuisineQuery,
  useGetMenuByCategoryQuery,
  useGetMenuByDietaryTypeQuery,
  useGetRecommendedItemsQuery,
  useSearchMenuQuery,
  useGetMenuByTagQuery,
  useGetAllMenuItemsQuery,
  useCreateMenuItemMutation,
  useCreateMultipleMenuItemsMutation,
  useUpdateMenuItemMutation,
  useToggleAvailabilityMutation,
  useSetAvailabilityMutation,
  useDeleteMenuItemMutation,
  useDeleteAllMenuItemsMutation,
  useGetMenuStatsQuery,
  Cuisine,
  MenuCategory,
  DietaryType,
} from './menuApi';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

describe('menuApi', () => {
  describe('endpoint definitions', () => {
    it('should have the correct reducerPath', () => {
      expect(menuApi.reducerPath).toBe('menuApi');
    });

    it('should define all expected endpoints', () => {
      const endpoints = menuApi.endpoints;
      expect(endpoints.getAvailableMenu).toBeDefined();
      expect(endpoints.getMenuItem).toBeDefined();
      expect(endpoints.getMenuByCuisine).toBeDefined();
      expect(endpoints.getMenuByCategory).toBeDefined();
      expect(endpoints.getMenuByDietaryType).toBeDefined();
      expect(endpoints.getRecommendedItems).toBeDefined();
      expect(endpoints.searchMenu).toBeDefined();
      expect(endpoints.getMenuByTag).toBeDefined();
      expect(endpoints.getAllMenuItems).toBeDefined();
      expect(endpoints.createMenuItem).toBeDefined();
      expect(endpoints.createMultipleMenuItems).toBeDefined();
      expect(endpoints.updateMenuItem).toBeDefined();
      expect(endpoints.toggleAvailability).toBeDefined();
      expect(endpoints.setAvailability).toBeDefined();
      expect(endpoints.deleteMenuItem).toBeDefined();
      expect(endpoints.deleteAllMenuItems).toBeDefined();
      expect(endpoints.getMenuStats).toBeDefined();
    });
  });

  describe('public query endpoints', () => {
    it('should fetch available menu items', async () => {
      const { result } = renderHook(() => useGetAvailableMenuQuery(), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
      expect(result.current.data!.length).toBeGreaterThan(0);
      expect(result.current.data![0].id).toBeDefined();
    });

    it('should transform response to map _id to id', async () => {
      server.use(
        http.get(`${API}/menu/public`, () =>
          HttpResponse.json([
            { _id: 'mongo-id-1', name: 'Test Item', isAvailable: true, displayOrder: 1, isRecommended: false, createdAt: '', updatedAt: '' },
          ]),
        ),
      );

      const { result } = renderHook(() => useGetAvailableMenuQuery(), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data![0].id).toBe('mongo-id-1');
    });

    it('should fetch a single menu item by ID', async () => {
      const { result } = renderHook(() => useGetMenuItemQuery('1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.id).toBe('1');
    });

    it('should fetch menu items by cuisine', async () => {
      const { result } = renderHook(() => useGetMenuByCuisineQuery(Cuisine.ITALIAN), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it('should fetch menu items by category', async () => {
      const { result } = renderHook(() => useGetMenuByCategoryQuery(MenuCategory.PIZZA), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch menu items by dietary type', async () => {
      const { result } = renderHook(() => useGetMenuByDietaryTypeQuery(DietaryType.VEGETARIAN), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch recommended items', async () => {
      const { result } = renderHook(() => useGetRecommendedItemsQuery(), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should search menu items', async () => {
      const { result } = renderHook(() => useSearchMenuQuery('pizza'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch menu items by tag', async () => {
      const { result } = renderHook(() => useGetMenuByTagQuery('popular'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });
  });

  describe('manager query endpoints', () => {
    it('should fetch all menu items', async () => {
      const { result } = renderHook(() => useGetAllMenuItemsQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it('should fetch all menu items with storeId', async () => {
      const { result } = renderHook(() => useGetAllMenuItemsQuery('store-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch menu stats', async () => {
      const { result } = renderHook(() => useGetMenuStatsQuery(), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.totalItems).toBe(25);
      expect(result.current.data!.availableItems).toBe(22);
    });
  });

  describe('mutation endpoints', () => {
    it('should create a menu item', async () => {
      const { result } = renderHook(() => useCreateMenuItemMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [createMenuItem] = result.current;
      createMenuItem({
        name: 'New Pizza',
        cuisine: Cuisine.ITALIAN,
        category: MenuCategory.PIZZA,
        basePrice: 35000,
      });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

      expect(result.current[1].data).toBeDefined();
    });

    it('should create multiple menu items', async () => {
      const { result } = renderHook(() => useCreateMultipleMenuItemsMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [createItems] = result.current;
      createItems([
        { name: 'Item 1', cuisine: Cuisine.ITALIAN, category: MenuCategory.PIZZA, basePrice: 25000 },
        { name: 'Item 2', cuisine: Cuisine.AMERICAN, category: MenuCategory.BURGER, basePrice: 20000 },
      ]);

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

      expect(result.current[1].data).toBeDefined();
    });

    it('should update a menu item', async () => {
      const { result } = renderHook(() => useUpdateMenuItemMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [updateMenuItem] = result.current;
      updateMenuItem({
        id: '1',
        data: { name: 'Updated Pizza', cuisine: Cuisine.ITALIAN, category: MenuCategory.PIZZA, basePrice: 32000 },
      });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

      expect(result.current[1].data).toBeDefined();
    });

    it('should toggle availability', async () => {
      const { result } = renderHook(() => useToggleAvailabilityMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [toggle] = result.current;
      toggle('1');

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

      expect(result.current[1].data).toBeDefined();
    });

    it('should set availability', async () => {
      const { result } = renderHook(() => useSetAvailabilityMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [setAvailability] = result.current;
      setAvailability({ id: '1', status: false });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

      expect(result.current[1].data).toBeDefined();
    });

    it('should delete a menu item', async () => {
      const { result } = renderHook(() => useDeleteMenuItemMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [deleteItem] = result.current;
      deleteItem('1');

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should delete all menu items', async () => {
      const { result } = renderHook(() => useDeleteAllMenuItemsMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [deleteAll] = result.current;
      deleteAll();

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });
  });

  describe('error handling', () => {
    it('should handle server error on getAvailableMenu', async () => {
      server.use(
        http.get(`${API}/menu/public`, () =>
          HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 }),
        ),
      );

      const { result } = renderHook(() => useGetAvailableMenuQuery(), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });

    it('should handle not found on getMenuItem', async () => {
      server.use(
        http.get(`${API}/menu/public/:id`, () =>
          HttpResponse.json({ message: 'Not found' }, { status: 404 }),
        ),
      );

      const { result } = renderHook(() => useGetMenuItemQuery('nonexistent'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });
});
