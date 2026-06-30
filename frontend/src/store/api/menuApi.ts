import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithAuth from './baseQueryWithAuth';
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

type MenuItemApiResponse = Omit<MenuItem, 'id'> & { id?: string; _id?: string };

const mapMenuItemResponse = (item: MenuItemApiResponse): MenuItem => ({
  ...item,
  id: item.id ?? item._id ?? '',
});

const mapMenuItemsResponse = (response: MenuItemApiResponse[]): MenuItem[] =>
  response.map(mapMenuItemResponse);

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
      query: () => '/menu',
      transformResponse: mapMenuItemsResponse,
      providesTags: () => ['Menu'],
    }),
    getMenuItem: builder.query<MenuItem, string>({
      query: (id) => `/menu/${id}`,
      transformResponse: mapMenuItemResponse,
      providesTags: (result, error, id) => [{ type: 'Menu', id }],
    }),
    getMenuByCuisine: builder.query<MenuItem[], Cuisine>({
      query: (cuisine) => `/menu?cuisine=${encodeURIComponent(cuisine)}`,
      transformResponse: mapMenuItemsResponse,
      providesTags: ['Menu'],
    }),
    getMenuByCategory: builder.query<MenuItem[], MenuCategory>({
      query: (category) => `/menu?category=${encodeURIComponent(category)}`,
      transformResponse: mapMenuItemsResponse,
      providesTags: ['Menu'],
    }),
    getMenuByDietaryType: builder.query<MenuItem[], DietaryType>({
      query: (dietaryType) => `/menu?dietary=${encodeURIComponent(dietaryType)}`,
      transformResponse: mapMenuItemsResponse,
      providesTags: ['Menu'],
    }),
    getRecommendedItems: builder.query<MenuItem[], void>({
      query: () => '/menu?recommended=true',
      transformResponse: mapMenuItemsResponse,
      providesTags: ['Menu'],
    }),
    searchMenu: builder.query<MenuItem[], string>({
      query: (searchTerm) => `/menu?search=${encodeURIComponent(searchTerm)}`,
      transformResponse: mapMenuItemsResponse,
      providesTags: ['Menu'],
    }),
    getMenuByTag: builder.query<MenuItem[], string>({
      query: (tag) => `/menu?tag=${encodeURIComponent(tag)}`,
      transformResponse: mapMenuItemsResponse,
      providesTags: ['Menu'],
    }),

    // Manager endpoints (auth required)
    getAllMenuItems: builder.query<MenuItem[], string | undefined>({
      query: () => '/menu',
      transformResponse: mapMenuItemsResponse,
      providesTags: (result, error, storeId) => [{ type: 'Menu', id: storeId || 'DEFAULT' }],
    }),
    createMenuItem: builder.mutation<MenuItem, MenuItemRequest>({
      query: (menuItem) => ({
        url: '/menu',
        method: 'POST',
        body: menuItem,
      }),
      transformResponse: mapMenuItemResponse,
      invalidatesTags: ['Menu', 'MenuStats'],
    }),
    createMultipleMenuItems: builder.mutation<MenuItem[], MenuItemRequest[]>({
      query: (menuItems) => ({
        url: '/menu/bulk',
        method: 'POST',
        body: menuItems,
      }),
      transformResponse: mapMenuItemsResponse,
      invalidatesTags: ['Menu', 'MenuStats'],
    }),
    updateMenuItem: builder.mutation<MenuItem, { id: string; data: MenuItemRequest }>({
      query: ({ id, data }) => ({
        url: `/menu/${id}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: mapMenuItemResponse,
      invalidatesTags: (result, error, { id }) => [{ type: 'Menu', id }, 'Menu', 'MenuStats'],
    }),
    toggleAvailability: builder.mutation<MenuItem, { id: string; isAvailable: boolean }>({
      query: ({ id, isAvailable }) => ({
        url: `/menu/${id}`,
        method: 'PATCH',
        body: { isAvailable },
      }),
      transformResponse: mapMenuItemResponse,
      invalidatesTags: (result, error, { id }) => [{ type: 'Menu', id }, 'Menu'],
    }),
    setAvailability: builder.mutation<MenuItem, { id: string; status: boolean }>({
      query: ({ id, status }) => ({
        url: `/menu/${id}`,
        method: 'PATCH',
        body: { isAvailable: status },
      }),
      transformResponse: mapMenuItemResponse,
      invalidatesTags: (result, error, { id }) => [{ type: 'Menu', id }, 'Menu'],
    }),
    deleteMenuItem: builder.mutation<void, string>({
      query: (id) => ({
        url: `/menu/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Menu', 'MenuStats'],
    }),
    copyMenu: builder.mutation<
      { success: boolean; copiedItemsCount: number; fromStoreId: string; toStoreId: string },
      { fromStoreId: string; toStoreId: string }
    >({
      query: ({ fromStoreId, toStoreId }) => ({
        url: `/menu/copy?fromStoreId=${encodeURIComponent(fromStoreId)}&toStoreId=${encodeURIComponent(toStoreId)}`,
        method: 'POST',
      }),
      invalidatesTags: ['Menu', 'MenuStats'],
    }),
    declareAllergens: builder.mutation<MenuItem, { id: string; data: AllergenDeclarationRequest }>({
      query: ({ id, data }) => ({
        url: `/menu/items/${id}/allergens`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: MenuItemApiResponse): MenuItem => ({
        ...mapMenuItemResponse(response),
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
  useCopyMenuMutation,
  useDeclareAllergensMutation,
  useGetMenuStatsQuery,
} = menuApi;
