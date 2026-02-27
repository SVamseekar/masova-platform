import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { DefaultTestWrapper } from '../../test/TestWrapper';
import {
  userApi,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetUserQuery,
  useUpdateUserMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
  useGetUsersByTypeQuery,
  useGetStoreEmployeesQuery,
  useGetManagersQuery,
  useCanTakeOrdersQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useValidatePINMutation,
  useSearchUsersQuery,
  useGetUserStatsQuery,
} from './userApi';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

describe('userApi', () => {
  describe('endpoint definitions', () => {
    it('should have the correct reducerPath', () => {
      expect(userApi.reducerPath).toBe('userApi');
    });

    it('should define all expected endpoints', () => {
      const endpoints = userApi.endpoints;
      expect(endpoints.getProfile).toBeDefined();
      expect(endpoints.updateProfile).toBeDefined();
      expect(endpoints.changePassword).toBeDefined();
      expect(endpoints.getUser).toBeDefined();
      expect(endpoints.updateUser).toBeDefined();
      expect(endpoints.activateUser).toBeDefined();
      expect(endpoints.deactivateUser).toBeDefined();
      expect(endpoints.getUsersByType).toBeDefined();
      expect(endpoints.getStoreEmployees).toBeDefined();
      expect(endpoints.getManagers).toBeDefined();
      expect(endpoints.canTakeOrders).toBeDefined();
      expect(endpoints.getUsers).toBeDefined();
      expect(endpoints.createUser).toBeDefined();
      expect(endpoints.validatePIN).toBeDefined();
      expect(endpoints.searchUsers).toBeDefined();
      expect(endpoints.getUserStats).toBeDefined();
    });
  });

  describe('query endpoints', () => {
    it('should fetch user profile', async () => {
      const { result } = renderHook(() => useGetProfileQuery(), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.name).toBe('Test Customer');
    });

    it('should fetch user by ID', async () => {
      const { result } = renderHook(() => useGetUserQuery('1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch users by type', async () => {
      const { result } = renderHook(() => useGetUsersByTypeQuery('STAFF'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch store employees', async () => {
      const { result } = renderHook(() => useGetStoreEmployeesQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch managers', async () => {
      const { result } = renderHook(() => useGetManagersQuery(), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should check if user can take orders', async () => {
      const { result } = renderHook(() => useCanTakeOrdersQuery('2'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.canTakeOrders).toBe(true);
    });

    it('should fetch all users', async () => {
      const { result } = renderHook(() => useGetUsersQuery(), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.length).toBeGreaterThan(0);
    });

    it('should search users', async () => {
      const { result } = renderHook(
        () => useSearchUsersQuery({ query: 'test' }),
        { wrapper: DefaultTestWrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch user stats', async () => {
      const { result } = renderHook(() => useGetUserStatsQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });
  });

  describe('mutation endpoints', () => {
    it('should update profile', async () => {
      const { result } = renderHook(() => useUpdateProfileMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [updateProfile] = result.current;
      updateProfile({ name: 'Updated Name' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should change password', async () => {
      const { result } = renderHook(() => useChangePasswordMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [changePassword] = result.current;
      changePassword({ currentPassword: 'old', newPassword: 'new' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should update a user', async () => {
      const { result } = renderHook(() => useUpdateUserMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [updateUser] = result.current;
      updateUser({ userId: '1', data: { name: 'Updated' } });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should activate a user', async () => {
      const { result } = renderHook(() => useActivateUserMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [activate] = result.current;
      activate('1');

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should deactivate a user', async () => {
      const { result } = renderHook(() => useDeactivateUserMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [deactivate] = result.current;
      deactivate('1');

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should create a user', async () => {
      const { result } = renderHook(() => useCreateUserMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [createUser] = result.current;
      createUser({
        name: 'New Staff',
        email: 'staff@example.com',
        password: 'password123',
        type: 'STAFF',
        storeId: '1',
      });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should validate PIN', async () => {
      const { result } = renderHook(() => useValidatePINMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [validatePIN] = result.current;
      validatePIN({ pin: '1234' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

      expect(result.current[1].data?.userId).toBe('2');
    });
  });

  describe('error handling', () => {
    it('should handle user not found', async () => {
      server.use(
        http.get(`${API}/users/:userId`, () =>
          HttpResponse.json({ message: 'Not found' }, { status: 404 }),
        ),
      );

      const { result } = renderHook(() => useGetUserQuery('nonexistent'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });
});
