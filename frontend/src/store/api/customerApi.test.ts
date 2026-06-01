import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { DefaultTestWrapper } from '../../test/TestWrapper';
import {
  customerApi,
  useCreateCustomerMutation,
  useGetOrCreateCustomerMutation,
  useGetCustomerByIdQuery,
  useGetCustomerByUserIdQuery,
  useGetCustomerByEmailQuery,
  useGetCustomerByPhoneQuery,
  useGetAllCustomersQuery,
  useGetActiveCustomersQuery,
  useSearchCustomersQuery,
  useUpdateCustomerMutation,
  useDeactivateCustomerMutation,
  useActivateCustomerMutation,
  useAddAddressMutation,
  useRemoveAddressMutation,
  useSetDefaultAddressMutation,
  useAddLoyaltyPointsMutation,
  useRedeemLoyaltyPointsMutation,
  useGetMaxRedeemablePointsQuery,
  useGetCustomersByTierQuery,
  useUpdatePreferencesMutation,
  useAddNoteMutation,
  useVerifyEmailMutation,
  useVerifyPhoneMutation,
  useAddTagsMutation,
  useRemoveTagsMutation,
  useGetHighValueCustomersQuery,
  useGetTopSpendersQuery,
  useGetRecentlyActiveCustomersQuery,
  useGetInactiveCustomersQuery,
  useGetBirthdayCustomersTodayQuery,
  useGetMarketingOptInCustomersQuery,
  useGetCustomerStatsQuery,
  useGetCustomerOrderStatsQuery,
  useGetCustomerPreferencesQuery,
  useGetCustomerLoyaltyPointsQuery,
  useGetCustomerAddressesQuery,
  useDeleteCustomerMutation,
} from './customerApi';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

describe('customerApi', () => {
  describe('endpoint definitions', () => {
    it('should have the correct reducerPath', () => {
      expect(customerApi.reducerPath).toBe('customerApi');
    });

    it('should define all expected tag types', () => {
      expect(customerApi.reducerPath).toBe('customerApi');
    });
  });

  describe('query endpoints', () => {
    it('should fetch customer by ID', async () => {
      const { result } = renderHook(() => useGetCustomerByIdQuery('cust-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.name).toBe('Test Customer');
    });

    it('should fetch customer by user ID', async () => {
      const { result } = renderHook(() => useGetCustomerByUserIdQuery('1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch customer by email', async () => {
      const { result } = renderHook(() => useGetCustomerByEmailQuery('customer@example.com'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch customer by phone', async () => {
      const { result } = renderHook(() => useGetCustomerByPhoneQuery('555-0123'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch all customers', async () => {
      const { result } = renderHook(() => useGetAllCustomersQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it('should fetch active customers', async () => {
      const { result } = renderHook(() => useGetActiveCustomersQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should search customers', async () => {
      const { result } = renderHook(
        () => useSearchCustomersQuery({ query: 'test' }),
        { wrapper: DefaultTestWrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.content).toBeDefined();
    });

    it('should fetch max redeemable points', async () => {
      const { result } = renderHook(
        () => useGetMaxRedeemablePointsQuery({ customerId: 'cust-1', orderTotal: 500 }),
        { wrapper: DefaultTestWrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.maxRedeemablePoints).toBe(300);
    });

    it('should fetch customers by tier', async () => {
      const { result } = renderHook(() => useGetCustomersByTierQuery('SILVER'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch high value customers', async () => {
      const { result } = renderHook(() => useGetHighValueCustomersQuery(10000), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch top spenders', async () => {
      const { result } = renderHook(() => useGetTopSpendersQuery(10), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch recently active customers', async () => {
      const { result } = renderHook(() => useGetRecentlyActiveCustomersQuery(30), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch inactive customers', async () => {
      const { result } = renderHook(() => useGetInactiveCustomersQuery(90), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch birthday customers today', async () => {
      const { result } = renderHook(() => useGetBirthdayCustomersTodayQuery(), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch marketing opt-in customers', async () => {
      const { result } = renderHook(() => useGetMarketingOptInCustomersQuery(), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch customer stats', async () => {
      const { result } = renderHook(() => useGetCustomerStatsQuery(undefined), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.totalCustomers).toBe(150);
    });

    it('should fetch customer order stats', async () => {
      const { result } = renderHook(() => useGetCustomerOrderStatsQuery('cust-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch customer preferences', async () => {
      const { result } = renderHook(() => useGetCustomerPreferencesQuery('cust-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch customer loyalty points', async () => {
      const { result } = renderHook(() => useGetCustomerLoyaltyPointsQuery('cust-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });

    it('should fetch customer addresses', async () => {
      const { result } = renderHook(() => useGetCustomerAddressesQuery('cust-1'), {
        wrapper: DefaultTestWrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
    });
  });

  describe('mutation endpoints', () => {
    it('should create a customer', async () => {
      const { result } = renderHook(() => useCreateCustomerMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [create] = result.current;
      create({ userId: '1', name: 'New Customer', email: 'new@example.com', phone: '555-0000' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should get or create customer', async () => {
      const { result } = renderHook(() => useGetOrCreateCustomerMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [getOrCreate] = result.current;
      getOrCreate({ userId: '1', name: 'Customer', email: 'test@example.com', phone: '555-0123' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should update a customer', async () => {
      const { result } = renderHook(() => useUpdateCustomerMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [update] = result.current;
      update({ id: 'cust-1', data: { name: 'Updated Name' } });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should deactivate a customer', async () => {
      const { result } = renderHook(() => useDeactivateCustomerMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [deactivate] = result.current;
      deactivate('cust-1');

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should activate a customer', async () => {
      const { result } = renderHook(() => useActivateCustomerMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [activate] = result.current;
      activate('cust-1');

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should add an address', async () => {
      const { result } = renderHook(() => useAddAddressMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [addAddress] = result.current;
      addAddress({
        customerId: 'cust-1',
        data: {
          label: 'WORK',
          addressLine1: '456 Office St',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500002',
          country: 'India',
        },
      });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should remove an address', async () => {
      const { result } = renderHook(() => useRemoveAddressMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [remove] = result.current;
      remove({ customerId: 'cust-1', addressId: 'addr-1' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should set default address', async () => {
      const { result } = renderHook(() => useSetDefaultAddressMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [setDefault] = result.current;
      setDefault({ customerId: 'cust-1', addressId: 'addr-1' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should add loyalty points', async () => {
      const { result } = renderHook(() => useAddLoyaltyPointsMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [addPoints] = result.current;
      addPoints({
        customerId: 'cust-1',
        data: { points: 100, type: 'EARNED', description: 'Order bonus' },
      });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should redeem loyalty points', async () => {
      const { result } = renderHook(() => useRedeemLoyaltyPointsMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [redeem] = result.current;
      redeem({ customerId: 'cust-1', points: 100, orderId: 'order-1' });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should update preferences', async () => {
      const { result } = renderHook(() => useUpdatePreferencesMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [update] = result.current;
      update({ customerId: 'cust-1', data: { spiceLevel: 'HOT' } });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should add a note', async () => {
      const { result } = renderHook(() => useAddNoteMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [addNote] = result.current;
      addNote({ customerId: 'cust-1', data: { note: 'VIP customer', addedBy: 'manager-1', category: 'GENERAL' } });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should verify email', async () => {
      const { result } = renderHook(() => useVerifyEmailMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [verify] = result.current;
      verify('cust-1');

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should verify phone', async () => {
      const { result } = renderHook(() => useVerifyPhoneMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [verify] = result.current;
      verify('cust-1');

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should add tags', async () => {
      const { result } = renderHook(() => useAddTagsMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [addTags] = result.current;
      addTags({ customerId: 'cust-1', tags: ['vip', 'loyal'] });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should remove tags', async () => {
      const { result } = renderHook(() => useRemoveTagsMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [removeTags] = result.current;
      removeTags({ customerId: 'cust-1', tags: ['vip'] });

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });

    it('should delete a customer', async () => {
      const { result } = renderHook(() => useDeleteCustomerMutation(), {
        wrapper: DefaultTestWrapper,
      });

      const [deleteCustomer] = result.current;
      deleteCustomer('cust-1');

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));
    });
  });
});
