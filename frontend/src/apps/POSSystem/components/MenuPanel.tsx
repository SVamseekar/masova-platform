// src/apps/POSSystem/components/MenuPanel.tsx
/**
 * POS menu column — Toast/Square-style dense tile grid.
 * Large touch targets, fast filter chips, clear empty/error/loading.
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  useGetAvailableMenuQuery,
  Cuisine,
  MenuCategory,
  DietaryType,
  type MenuItem,
} from '../../../store/api/menuApi';
import { useAppSelector } from '../../../store/hooks';
import {
  selectSelectedStoreId,
  selectCartCurrency,
  selectCartLocale,
} from '../../../store/slices/cartSlice';
import { formatMoney } from '../../../utils/currency';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import SearchIcon from '@mui/icons-material/Search';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import RefreshIcon from '@mui/icons-material/Refresh';
import { pos, posTouchBtnBase } from '../posTokens';

interface MenuPanelProps {
  onAddItem: (item: MenuItem, quantity?: number) => void;
}

const CUISINE_LABEL: Record<string, string> = {
  SOUTH_INDIAN: 'South Indian',
  NORTH_INDIAN: 'North Indian',
  INDO_CHINESE: 'Indo-Chinese',
  ITALIAN: 'Italian',
  AMERICAN: 'American',
  CONTINENTAL: 'Continental',
  BEVERAGES: 'Drinks',
  DESSERTS: 'Desserts',
};

function getCategoriesForCuisine(cuisine: Cuisine): MenuCategory[] {
  const categoryMap: Record<Cuisine, MenuCategory[]> = {
    [Cuisine.SOUTH_INDIAN]: [
      MenuCategory.DOSA,
      MenuCategory.IDLY_VADA,
      MenuCategory.SOUTH_INDIAN_MEALS,
      MenuCategory.RICE_VARIETIES,
    ],
    [Cuisine.NORTH_INDIAN]: [
      MenuCategory.CURRY_GRAVY,
      MenuCategory.DAL_DISHES,
      MenuCategory.NORTH_INDIAN_MEALS,
      MenuCategory.RICE_VARIETIES,
      MenuCategory.CHAPATI_ROTI,
      MenuCategory.NAAN_KULCHA,
    ],
    [Cuisine.INDO_CHINESE]: [
      MenuCategory.FRIED_RICE,
      MenuCategory.NOODLES,
      MenuCategory.MANCHURIAN,
    ],
    [Cuisine.ITALIAN]: [MenuCategory.PIZZA, MenuCategory.SIDES],
    [Cuisine.AMERICAN]: [MenuCategory.BURGER, MenuCategory.SIDES],
    [Cuisine.CONTINENTAL]: [MenuCategory.SIDES],
    [Cuisine.BEVERAGES]: [
      MenuCategory.HOT_DRINKS,
      MenuCategory.COLD_DRINKS,
      MenuCategory.TEA_CHAI,
    ],
    [Cuisine.DESSERTS]: [
      MenuCategory.COOKIES_BROWNIES,
      MenuCategory.ICE_CREAM,
      MenuCategory.DESSERT_SPECIALS,
    ],
  };
  return categoryMap[cuisine] || [];
}

const chipBase: React.CSSProperties = {
  ...posTouchBtnBase,
  minHeight: 40,
  padding: '8px 14px',
  fontSize: pos.type.fontSize.xs,
  fontWeight: pos.type.fontWeight.semibold,
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

const MenuPanel: React.FC<MenuPanelProps> = ({ onAddItem }) => {
  const currency = useAppSelector(selectCartCurrency);
  const locale = useAppSelector(selectCartLocale);
  const selectedStoreId = useAppSelector(selectSelectedStoreId);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<Cuisine>(Cuisine.SOUTH_INDIAN);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [selectedDietary, setSelectedDietary] = useState<DietaryType | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const { data: menuItems = [], isLoading, error, refetch } = useGetAvailableMenuQuery(
    undefined,
    { refetchOnMountOrArgChange: true }
  );

  useEffect(() => {
    if (selectedStoreId) {
      void refetch();
    }
  }, [selectedStoreId, refetch]);

  const availableCategories = getCategoriesForCuisine(selectedCuisine);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item: MenuItem) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCuisine = item.cuisine === selectedCuisine;
      const matchesCategory = selectedCategory === null || item.category === selectedCategory;
      const matchesDietary = !selectedDietary || item.dietaryInfo?.includes(selectedDietary);
      return matchesSearch && matchesCuisine && matchesCategory && matchesDietary && item.isAvailable;
    });
  }, [menuItems, searchTerm, selectedCuisine, selectedCategory, selectedDietary]);

  const popularItems = useMemo(
    () =>
      menuItems
        .filter(
          (item: MenuItem) =>
            item.isRecommended && item.isAvailable && item.cuisine === selectedCuisine
        )
        .slice(0, 4),
    [menuItems, selectedCuisine]
  );

  const handleAdd = (item: MenuItem) => {
    onAddItem(item);
    setJustAddedId(item.id);
    window.setTimeout(() => setJustAddedId((id) => (id === item.id ? null : id)), 280);
  };

  return (
    <div
      data-testid="menu-panel"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
    >
      {/* Sticky filter header */}
      <div
        style={{
          padding: pos.space[3],
          borderBottom: `2px solid ${pos.border}`,
          background: `linear-gradient(180deg, ${pos.surface} 0%, ${pos.surfaceAlt} 100%)`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: pos.space[2],
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: pos.type.fontSize.base,
              fontWeight: pos.type.fontWeight.bold,
              color: pos.ink,
              display: 'flex',
              alignItems: 'center',
              gap: pos.space[2],
            }}
          >
            <RestaurantMenuIcon style={{ fontSize: 22, color: pos.role }} />
            Menu
          </h3>
          <span
            style={{
              fontSize: pos.type.fontSize.xs,
              fontWeight: pos.type.fontWeight.semibold,
              background: pos.roleSoft,
              color: pos.roleDark,
              padding: '4px 10px',
              borderRadius: pos.radius.full,
            }}
          >
            {filteredItems.length} items
          </span>
        </div>

        {/* Search — large hit area */}
        <div style={{ position: 'relative', marginBottom: pos.space[2] }}>
          <SearchIcon
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 18,
              color: pos.faint,
              pointerEvents: 'none',
            }}
          />
          <input
            type="search"
            placeholder="Search menu…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search menu items"
            style={{
              width: '100%',
              minHeight: pos.touchMin,
              padding: `12px 14px 12px 44px`,
              border: `2px solid ${pos.border}`,
              borderRadius: pos.radius.md,
              outline: 'none',
              backgroundColor: pos.surface,
              fontSize: pos.type.fontSize.sm,
              color: pos.ink,
              fontFamily: pos.font,
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = pos.role;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${pos.roleSoft}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = pos.border;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Cuisine strip */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 6,
            marginBottom: 6,
            scrollbarWidth: 'thin',
          }}
        >
          {Object.values(Cuisine).map((cuisine) => {
            const active = selectedCuisine === cuisine;
            return (
              <button
                key={cuisine}
                type="button"
                onClick={() => {
                  setSelectedCuisine(cuisine);
                  setSelectedCategory(null);
                }}
                style={{
                  ...chipBase,
                  ...(active
                    ? {
                        background: pos.role,
                        color: pos.inverse,
                        boxShadow: `0 4px 12px ${pos.roleShadow}`,
                      }
                    : {
                        background: pos.surface,
                        color: pos.muted,
                        border: `1px solid ${pos.border}`,
                      }),
                }}
              >
                {CUISINE_LABEL[cuisine] || cuisine.replace(/_/g, ' ')}
              </button>
            );
          })}
        </div>

        {/* Category chips */}
        {availableCategories.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              paddingBottom: 4,
              marginBottom: 6,
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              style={{
                ...chipBase,
                minHeight: 36,
                ...(selectedCategory === null
                  ? { background: pos.roleDark, color: pos.inverse }
                  : { background: pos.surfaceAlt, color: pos.muted }),
              }}
            >
              All
            </button>
            {availableCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                style={{
                  ...chipBase,
                  minHeight: 36,
                  ...(selectedCategory === category
                    ? { background: pos.roleDark, color: pos.inverse }
                    : { background: pos.surfaceAlt, color: pos.muted }),
                }}
              >
                {category.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        )}

        {/* Dietary pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(
            [
              { key: null, label: 'All diet' },
              { key: DietaryType.VEGETARIAN, label: 'Veg' },
              { key: DietaryType.VEGAN, label: 'Vegan' },
              { key: DietaryType.NON_VEGETARIAN, label: 'Non-veg' },
            ] as const
          ).map(({ key, label }) => {
            const active = selectedDietary === key;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setSelectedDietary(key)}
                style={{
                  ...chipBase,
                  minHeight: 32,
                  padding: '6px 12px',
                  fontSize: 11,
                  ...(active
                    ? {
                        background:
                          key === DietaryType.NON_VEGETARIAN
                            ? pos.error
                            : key === DietaryType.VEGAN
                              ? pos.successDark
                              : pos.success,
                        color: pos.inverse,
                      }
                    : { background: pos.surfaceAlt, color: pos.faint }),
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick-add popular */}
      {!searchTerm && selectedCategory === null && popularItems.length > 0 && (
        <div
          style={{
            padding: `${pos.space[2]} ${pos.space[3]}`,
            backgroundColor: pos.roleSoft,
            borderBottom: `1px solid ${pos.roleBorder}`,
            flexShrink: 0,
          }}
        >
          <p
            style={{
              margin: `0 0 ${pos.space[2]} 0`,
              fontSize: 11,
              fontWeight: pos.type.fontWeight.bold,
              color: pos.roleDark,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <LocalFireDepartmentIcon style={{ fontSize: 14 }} />
            Popular — tap to add
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {popularItems.map((item: MenuItem) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleAdd(item)}
                style={{
                  ...posTouchBtnBase,
                  minHeight: 44,
                  padding: '8px 14px',
                  background: pos.role,
                  color: pos.inverse,
                  fontSize: pos.type.fontSize.xs,
                  boxShadow: `0 2px 8px ${pos.roleShadow}`,
                }}
              >
                {item.name}
                <span style={{ opacity: 0.85, fontWeight: 500 }}>
                  {formatMoney(item.basePrice, currency, locale)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: pos.space[3],
          minHeight: 0,
          background: pos.surfaceBg,
        }}
      >
        {isLoading && (
          <div
            data-testid="menu-loading"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))',
              gap: 10,
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 128,
                  borderRadius: pos.radius.md,
                  background: pos.border,
                  animation: 'posMenuPulse 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
            <style>{`
              @keyframes posMenuPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.45; }
              }
            `}</style>
          </div>
        )}

        {error && (
          <div
            data-testid="menu-error"
            style={{
              padding: pos.space[6],
              borderRadius: pos.radius.lg,
              border: `2px solid ${pos.error}`,
              background: pos.errorSoft,
              textAlign: 'center',
            }}
          >
            <p style={{ margin: `0 0 ${pos.space[3]} 0`, color: pos.ink, fontWeight: 600 }}>
              Couldn’t load menu
            </p>
            <p style={{ margin: `0 0 ${pos.space[4]} 0`, color: pos.muted, fontSize: 13 }}>
              Check network or store selection, then retry.
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              style={{
                ...posTouchBtnBase,
                background: pos.role,
                color: pos.inverse,
              }}
            >
              <RefreshIcon style={{ fontSize: 18 }} />
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && filteredItems.length === 0 && (
          <div
            data-testid="menu-empty"
            style={{
              padding: pos.space[8],
              borderRadius: pos.radius.lg,
              border: `2px dashed ${pos.border}`,
              background: pos.surface,
              textAlign: 'center',
              color: pos.muted,
            }}
          >
            <RestaurantMenuIcon style={{ fontSize: 40, color: pos.faint, marginBottom: 12 }} />
            <div style={{ fontWeight: 600, color: pos.ink, marginBottom: 6 }}>
              {searchTerm ? 'No matches' : 'No items in this filter'}
            </div>
            <div style={{ fontSize: 13 }}>
              {searchTerm
                ? 'Try another search or clear filters.'
                : 'Switch cuisine or category to browse available items.'}
            </div>
          </div>
        )}

        {!isLoading && !error && filteredItems.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))',
              gap: 10,
            }}
          >
            {filteredItems.map((item: MenuItem) => {
              const flash = justAddedId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`menu-item-${item.id}`}
                  onClick={() => handleAdd(item)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    textAlign: 'left',
                    minHeight: 132,
                    padding: 12,
                    borderRadius: pos.radius.md,
                    border: flash ? `2px solid ${pos.success}` : `2px solid ${pos.border}`,
                    background: flash ? pos.successSoft : pos.surface,
                    cursor: 'pointer',
                    boxShadow: pos.shadow.raised.sm,
                    transition: 'transform 0.12s ease, border-color 0.12s ease, background 0.12s ease',
                    fontFamily: pos.font,
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = pos.role;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 8px 16px ${pos.roleShadow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = flash ? pos.success : pos.border;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = pos.shadow.raised.sm as string;
                  }}
                >
                  {item.isRecommended && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: pos.warning,
                      }}
                      title="Popular"
                    />
                  )}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: pos.ink,
                      lineHeight: 1.25,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: '2.5em',
                      marginBottom: 6,
                      paddingRight: 10,
                    }}
                  >
                    {item.name}
                  </span>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                    {item.dietaryInfo?.includes(DietaryType.VEGETARIAN) && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '2px 5px',
                          borderRadius: 4,
                          background: pos.successSoft,
                          color: pos.successDark,
                        }}
                      >
                        VEG
                      </span>
                    )}
                    {item.dietaryInfo?.includes(DietaryType.NON_VEGETARIAN) && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '2px 5px',
                          borderRadius: 4,
                          background: pos.errorSoft,
                          color: pos.errorDark,
                        }}
                      >
                        NON-VEG
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      marginTop: 'auto',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: pos.roleDark,
                      }}
                    >
                      {formatMoney(item.basePrice, currency, locale)}
                    </span>
                    <span
                      style={{
                        minWidth: 40,
                        minHeight: 36,
                        borderRadius: pos.radius.sm,
                        background: pos.role,
                        color: pos.inverse,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 18,
                        lineHeight: 1,
                      }}
                      aria-hidden
                    >
                      +
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuPanel;
