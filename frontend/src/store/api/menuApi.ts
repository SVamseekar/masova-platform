import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithAuth from './baseQueryWithAuth';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';
import { AllergenType } from '../../constants/allergens';

// Enums matching backend
export enum Cuisine {
  SOUTH_INDIAN = 'SOUTH_INDIAN',
  NORTH_INDIAN = 'NORTH_INDIAN',
  INDO_CHINESE = 'INDO_CHINESE',
  ITALIAN = 'ITALIAN',
  AMERICAN = 'AMERICAN',
  CONTINENTAL = 'CONTINENTAL',
  BEVERAGES = 'BEVERAGES',
  DESSERTS = 'DESSERTS',
}

export enum MenuCategory {
  // South Indian
  DOSA = 'DOSA',
  IDLY_VADA = 'IDLY_VADA',
  SOUTH_INDIAN_MEALS = 'SOUTH_INDIAN_MEALS',

  // North Indian
  CURRY_GRAVY = 'CURRY_GRAVY',
  DAL_DISHES = 'DAL_DISHES',
  NORTH_INDIAN_MEALS = 'NORTH_INDIAN_MEALS',

  // Indo-Chinese
  FRIED_RICE = 'FRIED_RICE',
  NOODLES = 'NOODLES',
  MANCHURIAN = 'MANCHURIAN',

  // Common
  RICE_VARIETIES = 'RICE_VARIETIES',
  CHAPATI_ROTI = 'CHAPATI_ROTI',
  NAAN_KULCHA = 'NAAN_KULCHA',

  // Western
  PIZZA = 'PIZZA',
  BURGER = 'BURGER',
  SIDES = 'SIDES',

  // Beverages
  HOT_DRINKS = 'HOT_DRINKS',
  COLD_DRINKS = 'COLD_DRINKS',
  TEA_CHAI = 'TEA_CHAI',

  // Desserts
  COOKIES_BROWNIES = 'COOKIES_BROWNIES',
  ICE_CREAM = 'ICE_CREAM',
  DESSERT_SPECIALS = 'DESSERT_SPECIALS',
}

export enum SpiceLevel {
  NONE = 'NONE',
  MILD = 'MILD',
  MEDIUM = 'MEDIUM',
  HOT = 'HOT',
  EXTRA_HOT = 'EXTRA_HOT',
}

export enum DietaryType {
  VEGETARIAN = 'VEGETARIAN',
  VEGAN = 'VEGAN',
  NON_VEGETARIAN = 'NON_VEGETARIAN',
  CONTAINS_EGGS = 'CONTAINS_EGGS',
  HALAL = 'HALAL',
  JAIN = 'JAIN',
}

// Types
export interface MenuVariant {
  name: string;
  priceModifier: number; // in paise
}

export interface MenuCustomization {
  name: string;
  price: number; // in paise
  isAvailable: boolean;
}

export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  servingSize?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  cuisine: Cuisine;
  category: MenuCategory;
  subCategory?: string;
  basePrice: number; // in paise
  price?: number; // Alias for basePrice (for backwards compatibility)
  variants?: MenuVariant[];
  customizations?: MenuCustomization[];
  dietaryInfo?: DietaryType[];
  spiceLevel?: SpiceLevel;
  nutritionalInfo?: NutritionalInfo;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime?: number; // in minutes
  servingSize?: string;
  ingredients?: string[];
  allergens?: AllergenType[];
  allergensDeclared?: boolean;
  preparationInstructions?: string[];
  storeId?: string;
  displayOrder: number;
  tags?: string[];
  isRecommended: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemRequest {
  name: string;
  description?: string;
  cuisine: Cuisine;
  category: MenuCategory;
  subCategory?: string;
  basePrice: number;
  variants?: MenuVariant[];
  customizations?: MenuCustomization[];
  dietaryInfo?: DietaryType[];
  spiceLevel?: SpiceLevel;
  nutritionalInfo?: NutritionalInfo;
  imageUrl?: string;
  isAvailable?: boolean;
  preparationTime?: number;
  servingSize?: string;
  ingredients?: string[];
  allergens?: AllergenType[];
  allergensDeclared?: boolean;
  preparationInstructions?: string[];
  storeId?: string;
  displayOrder?: number;
  tags?: string[];
  isRecommended?: boolean;
}

export interface AllergenDeclarationRequest {
  allergens: AllergenType[];
  allergenFree: boolean;
}

export interface MenuStats {
  totalItems: number;
  availableItems: number;
  southIndianCount: number;
  northIndianCount: number;
  indoChineseCount: number;
  italianCount: number;
  pizzaCount: number;
  burgerCount: number;
}

export const menuApi = createApi({
  reducerPath: 'menuApi',
  baseQuery: baseQueryWithAuth,
  refetchOnMountOrArgChange: 30, // Only refetch if data is older than 30 seconds
  refetchOnReconnect: true,
  refetchOnFocus: false, // Don't refetch on window focus to reduce unnecessary requests
  tagTypes: ['Menu', 'MenuStats'],
  endpoints: (builder) => ({
    // Public endpoints (no auth required)
    getAvailableMenu: builder.query<MenuItem[], void>({
      query: () => '/menu/public',
      transformResponse: (response: any[]): MenuItem[] => {
        // Map MongoDB _id to id for frontend compatibility
        return response.map(item => ({
          ...item,
          id: item.id || item._id
        }));
      },
      providesTags: (result, error, arg) => {
        // Tag with store ID from headers for proper cache invalidation
        return ['Menu'];
      },
    }),
    getMenuItem: builder.query<MenuItem, string>({
      query: (id) => `/menu/public/${id}`,
      transformResponse: (response: any): MenuItem => ({
        ...response,
        id: response.id || response._id
      }),
      providesTags: (result, error, id) => [{ type: 'Menu', id }],
    }),
    getMenuByCuisine: builder.query<MenuItem[], Cuisine>({
      query: (cuisine) => `/menu/public/cuisine/${cuisine}`,
      transformResponse: (response: any[]): MenuItem[] => {
        return response.map(item => ({
          ...item,
          id: item.id || item._id
        }));
      },
      providesTags: ['Menu'],
    }),
    getMenuByCategory: builder.query<MenuItem[], MenuCategory>({
      query: (category) => `/menu/public/category/${category}`,
      transformResponse: (response: any[]): MenuItem[] => {
        return response.map(item => ({
          ...item,
          id: item.id || item._id
        }));
      },
      providesTags: ['Menu'],
    }),
    getMenuByDietaryType: builder.query<MenuItem[], DietaryType>({
      query: (dietaryType) => `/menu/public/dietary/${dietaryType}`,
      transformResponse: (response: any[]): MenuItem[] => {
        return response.map(item => ({
          ...item,
          id: item.id || item._id
        }));
      },
      providesTags: ['Menu'],
    }),
    getRecommendedItems: builder.query<MenuItem[], void>({
      query: () => '/menu/public/recommended',
      transformResponse: (response: any[]): MenuItem[] => {
        return response.map(item => ({
          ...item,
          id: item.id || item._id
        }));
      },
      providesTags: ['Menu'],
    }),
    searchMenu: builder.query<MenuItem[], string>({
      query: (searchTerm) => `/menu/public/search?q=${encodeURIComponent(searchTerm)}`,
      transformResponse: (response: any[]): MenuItem[] => {
        return response.map(item => ({
          ...item,
          id: item.id || item._id
        }));
      },
      providesTags: ['Menu'],
    }),
    getMenuByTag: builder.query<MenuItem[], string>({
      query: (tag) => `/menu/public/tag/${tag}`,
      transformResponse: (response: any[]): MenuItem[] => {
        return response.map(item => ({
          ...item,
          id: item.id || item._id
        }));
      },
      providesTags: ['Menu'],
    }),

    // Manager endpoints (auth required)
    getAllMenuItems: builder.query<MenuItem[], string | undefined>({
      query: (storeId) => `/menu/items${storeId ? `?storeId=${storeId}` : ''}`,
      transformResponse: (response: any[]): MenuItem[] => {
        return response.map(item => ({
          ...item,
          id: item.id || item._id
        }));
      },
      providesTags: (result, error, storeId) => [{ type: 'Menu', id: storeId || 'DEFAULT' }],
    }),
    createMenuItem: builder.mutation<MenuItem, MenuItemRequest>({
      query: (menuItem) => ({
        url: '/menu/items',
        method: 'POST',
        body: menuItem,
      }),
      transformResponse: (response: any): MenuItem => ({
        ...response,
        id: response.id || response._id
      }),
      invalidatesTags: ['Menu', 'MenuStats'],
    }),
    createMultipleMenuItems: builder.mutation<MenuItem[], MenuItemRequest[]>({
      query: (menuItems) => ({
        url: '/menu/items/bulk',
        method: 'POST',
        body: menuItems,
      }),
      transformResponse: (response: any[]): MenuItem[] => {
        return response.map(item => ({
          ...item,
          id: item.id || item._id
        }));
      },
      invalidatesTags: ['Menu', 'MenuStats'],
    }),
    updateMenuItem: builder.mutation<MenuItem, { id: string; data: MenuItemRequest }>({
      query: ({ id, data }) => ({
        url: `/menu/items/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: any): MenuItem => ({
        ...response,
        id: response.id || response._id
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Menu', id }, 'Menu', 'MenuStats'],
    }),
    toggleAvailability: builder.mutation<MenuItem, string>({
      query: (id) => ({
        url: `/menu/items/${id}/availability`,
        method: 'PATCH',
      }),
      transformResponse: (response: any): MenuItem => ({
        ...response,
        id: response.id || response._id
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Menu', id }, 'Menu'],
    }),
    setAvailability: builder.mutation<MenuItem, { id: string; status: boolean }>({
      query: ({ id, status }) => ({
        url: `/menu/items/${id}/availability/${status}`,
        method: 'PATCH',
      }),
      transformResponse: (response: any): MenuItem => ({
        ...response,
        id: response.id || response._id
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Menu', id }, 'Menu'],
    }),
    deleteMenuItem: builder.mutation<void, string>({
      query: (id) => ({
        url: `/menu/items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Menu', 'MenuStats'],
    }),
    deleteAllMenuItems: builder.mutation<void, void>({
      query: () => ({
        url: '/menu/items',
        method: 'DELETE',
      }),
      invalidatesTags: ['Menu', 'MenuStats'],
    }),
    declareAllergens: builder.mutation<MenuItem, { id: string; data: AllergenDeclarationRequest }>({
      query: ({ id, data }) => ({
        url: `/menu/items/${id}/allergens`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: any): MenuItem => ({
        ...response,
        price: response.basePrice,
      }),
      invalidatesTags: ['Menu'],
    }),
    getMenuStats: builder.query<MenuStats, void>({
      query: () => '/menu/stats',
      providesTags: ['MenuStats'],
    }),
  }),
});

export const {
  // Public hooks
  useGetAvailableMenuQuery,
  useGetMenuItemQuery,
  useGetMenuByCuisineQuery,
  useGetMenuByCategoryQuery,
  useGetMenuByDietaryTypeQuery,
  useGetRecommendedItemsQuery,
  useSearchMenuQuery,
  useLazySearchMenuQuery,
  useGetMenuByTagQuery,

  // Manager hooks
  useGetAllMenuItemsQuery,
  useCreateMenuItemMutation,
  useCreateMultipleMenuItemsMutation,
  useUpdateMenuItemMutation,
  useToggleAvailabilityMutation,
  useSetAvailabilityMutation,
  useDeleteMenuItemMutation,
  useDeleteAllMenuItemsMutation,
  useDeclareAllergensMutation,
  useGetMenuStatsQuery,
} = menuApi;
