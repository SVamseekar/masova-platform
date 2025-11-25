import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';

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
  allergens?: string[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  cuisine: Cuisine;
  category: MenuCategory;
  subCategory?: string;
  basePrice: number; // in paise
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
  allergens?: string[];
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
  allergens?: string[];
  preparationInstructions?: string[];
  storeId?: string;
  displayOrder?: number;
  tags?: string[];
  isRecommended?: boolean;
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
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:8082', // Menu service runs on port 8082
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Menu', 'MenuStats'],
  endpoints: (builder) => ({
    // Public endpoints (no auth required)
    getAvailableMenu: builder.query<MenuItem[], void>({
      query: () => '/api/menu/public',
      providesTags: ['Menu'],
    }),
    getMenuItem: builder.query<MenuItem, string>({
      query: (id) => `/api/menu/public/${id}`,
      providesTags: (result, error, id) => [{ type: 'Menu', id }],
    }),
    getMenuByCuisine: builder.query<MenuItem[], Cuisine>({
      query: (cuisine) => `/api/menu/public/cuisine/${cuisine}`,
      providesTags: ['Menu'],
    }),
    getMenuByCategory: builder.query<MenuItem[], MenuCategory>({
      query: (category) => `/api/menu/public/category/${category}`,
      providesTags: ['Menu'],
    }),
    getMenuByDietaryType: builder.query<MenuItem[], DietaryType>({
      query: (dietaryType) => `/api/menu/public/dietary/${dietaryType}`,
      providesTags: ['Menu'],
    }),
    getRecommendedItems: builder.query<MenuItem[], void>({
      query: () => '/api/menu/public/recommended',
      providesTags: ['Menu'],
    }),
    searchMenu: builder.query<MenuItem[], string>({
      query: (searchTerm) => `/api/menu/public/search?q=${encodeURIComponent(searchTerm)}`,
      providesTags: ['Menu'],
    }),
    getMenuByTag: builder.query<MenuItem[], string>({
      query: (tag) => `/api/menu/public/tag/${tag}`,
      providesTags: ['Menu'],
    }),

    // Manager endpoints (auth required)
    getAllMenuItems: builder.query<MenuItem[], void>({
      query: () => '/api/menu/items',
      providesTags: ['Menu'],
    }),
    createMenuItem: builder.mutation<MenuItem, MenuItemRequest>({
      query: (menuItem) => ({
        url: '/api/menu/items',
        method: 'POST',
        body: menuItem,
      }),
      invalidatesTags: ['Menu', 'MenuStats'],
    }),
    createMultipleMenuItems: builder.mutation<MenuItem[], MenuItemRequest[]>({
      query: (menuItems) => ({
        url: '/api/menu/items/bulk',
        method: 'POST',
        body: menuItems,
      }),
      invalidatesTags: ['Menu', 'MenuStats'],
    }),
    updateMenuItem: builder.mutation<MenuItem, { id: string; data: MenuItemRequest }>({
      query: ({ id, data }) => ({
        url: `/api/menu/items/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Menu', id }, 'Menu', 'MenuStats'],
    }),
    toggleAvailability: builder.mutation<MenuItem, string>({
      query: (id) => ({
        url: `/api/menu/items/${id}/availability`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Menu', id }, 'Menu'],
    }),
    setAvailability: builder.mutation<MenuItem, { id: string; status: boolean }>({
      query: ({ id, status }) => ({
        url: `/api/menu/items/${id}/availability/${status}`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Menu', id }, 'Menu'],
    }),
    deleteMenuItem: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/menu/items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Menu', 'MenuStats'],
    }),
    deleteAllMenuItems: builder.mutation<void, void>({
      query: () => ({
        url: '/api/menu/items',
        method: 'DELETE',
      }),
      invalidatesTags: ['Menu', 'MenuStats'],
    }),
    getMenuStats: builder.query<MenuStats, void>({
      query: () => '/api/menu/stats',
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
  useGetMenuStatsQuery,
} = menuApi;
