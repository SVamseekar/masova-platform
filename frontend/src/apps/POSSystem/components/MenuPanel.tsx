// src/apps/POSSystem/components/MenuPanel.tsx
import React, { useState, useEffect } from 'react';
import { useGetAvailableMenuQuery, Cuisine, MenuCategory, DietaryType } from '../../../store/api/menuApi';
import { useAppSelector } from '../../../store/hooks';
import { selectSelectedStoreId } from '../../../store/slices/cartSlice';
import { CURRENCY } from '../../../config/business-config';
import Card from '../../../components/ui/neumorphic/Card';
import Badge from '../../../components/ui/neumorphic/Badge';
import { colors, shadows, spacing, typography } from '../../../styles/design-tokens';

interface MenuPanelProps {
  onAddItem: (item: any, quantity?: number) => void;
}

const MenuPanel: React.FC<MenuPanelProps> = ({ onAddItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<Cuisine>(Cuisine.SOUTH_INDIAN);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [selectedDietary, setSelectedDietary] = useState<DietaryType | null>(null);

  // Get selected store to force refetch when it changes
  const selectedStoreId = useAppSelector(selectSelectedStoreId);

  const { data: menuItems = [], isLoading, error, refetch } = useGetAvailableMenuQuery(undefined, {
    refetchOnMountOrArgChange: true, // Always refetch on mount
  });

  // Debug logging
  useEffect(() => {
    console.log('[MenuPanel] Menu data:', {
      itemsCount: menuItems.length,
      isLoading,
      error,
      selectedStoreId,
      firstItem: menuItems[0]?.name
    });
  }, [menuItems, isLoading, error, selectedStoreId]);

  // Refetch menu when store changes
  useEffect(() => {
    if (selectedStoreId) {
      console.log('[MenuPanel] Store changed, refetching menu for store:', selectedStoreId);
      refetch();
    }
  }, [selectedStoreId, refetch]);

  // Category mappings based on cuisine (same as customer page)
  const getCategoriesForCuisine = (cuisine: Cuisine): MenuCategory[] => {
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
      [Cuisine.ITALIAN]: [
        MenuCategory.PIZZA,
        MenuCategory.SIDES,
      ],
      [Cuisine.AMERICAN]: [
        MenuCategory.BURGER,
        MenuCategory.SIDES,
      ],
      [Cuisine.CONTINENTAL]: [
        MenuCategory.SIDES,
      ],
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
  };

  const availableCategories = getCategoriesForCuisine(selectedCuisine);

  // Filter menu items (same logic as customer page)
  const filteredItems = menuItems.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCuisine = item.cuisine === selectedCuisine;
    const matchesCategory = selectedCategory === null || item.category === selectedCategory;
    const matchesDietary = !selectedDietary || item.dietaryInfo?.includes(selectedDietary);
    const isAvailable = item.isAvailable;

    return matchesSearch && matchesCuisine && matchesCategory && matchesDietary && isAvailable;
  });

  // Quick add popular items
  const popularItems = menuItems
    .filter((item: any) => item.isRecommended && item.isAvailable && item.cuisine === selectedCuisine)
    .slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: spacing[3],
        borderBottom: `2px solid ${colors.surface.border}`,
        background: `linear-gradient(135deg, ${colors.surface.background} 0%, ${colors.surface.secondary} 100%)`
      }}>
        <h3 style={{
          margin: `0 0 ${spacing[3]} 0`,
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.bold,
          color: colors.text.primary,
          display: 'flex',
          alignItems: 'center',
          gap: spacing[2]
        }}>
          <span style={{ fontSize: typography.fontSize.lg }}>🍽️</span>
          Menu Items
        </h3>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: spacing[3] }}>
          <div style={{
            position: 'absolute',
            left: spacing[3],
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: typography.fontSize.sm,
            color: colors.text.tertiary
          }}>
            🔍
          </div>
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: `${spacing[2]} ${spacing[2]} ${spacing[2]} ${spacing[8]}`,
              border: `2px solid ${colors.surface.border}`,
              borderRadius: '10px',
              outline: 'none',
              backgroundColor: colors.surface.primary,
              fontSize: typography.fontSize.xs,
              color: colors.text.primary,
              fontFamily: typography.fontFamily.primary,
              boxShadow: shadows.inset.sm,
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.brand.primary;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.brand.primary}22`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.surface.border;
              e.currentTarget.style.boxShadow = shadows.inset.sm;
            }}
          />
        </div>

        {/* Cuisine Tabs */}
        <div style={{
          display: 'flex',
          gap: spacing[2],
          overflowX: 'auto',
          paddingBottom: spacing[2],
          marginBottom: spacing[3]
        }}>
          {Object.values(Cuisine).map((cuisine) => (
            <button
              key={cuisine}
              onClick={() => {
                setSelectedCuisine(cuisine);
                setSelectedCategory(null);
              }}
              style={{
                padding: `${spacing[2]} ${spacing[4]}`,
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
                fontFamily: typography.fontFamily.primary,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                ...(selectedCuisine === cuisine ? {
                  background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.secondary} 100%)`,
                  color: colors.text.inverse,
                  boxShadow: shadows.floating.md
                } : {
                  background: colors.surface.primary,
                  color: colors.text.secondary,
                  boxShadow: shadows.raised.sm
                })
              }}
              onMouseEnter={(e) => {
                if (selectedCuisine !== cuisine) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = shadows.floating.sm;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCuisine !== cuisine) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = shadows.raised.sm;
                }
              }}
            >
              {cuisine.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Category Tabs (based on selected cuisine) */}
        {availableCategories.length > 0 && (
          <div style={{
            display: 'flex',
            gap: spacing[2],
            overflowX: 'auto',
            paddingBottom: spacing[2],
            marginBottom: spacing[3]
          }}>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                padding: `${spacing[2]} ${spacing[3]}`,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                fontFamily: typography.fontFamily.primary,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                ...(selectedCategory === null ? {
                  background: colors.semantic.info,
                  color: colors.text.inverse,
                  boxShadow: shadows.raised.sm
                } : {
                  background: colors.surface.secondary,
                  color: colors.text.secondary,
                  boxShadow: shadows.inset.sm
                })
              }}
            >
              All
            </button>
            {availableCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: `${spacing[2]} ${spacing[3]}`,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                  fontFamily: typography.fontFamily.primary,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  ...(selectedCategory === category ? {
                    background: colors.semantic.info,
                    color: colors.text.inverse,
                    boxShadow: shadows.raised.sm
                  } : {
                    background: colors.surface.secondary,
                    color: colors.text.secondary,
                    boxShadow: shadows.inset.sm
                  })
                }}
              >
                {category.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        )}

        {/* Dietary Filter */}
        <div style={{
          display: 'flex',
          gap: spacing[2],
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setSelectedDietary(null)}
            style={{
              padding: `${spacing[1]} ${spacing[3]}`,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              fontFamily: typography.fontFamily.primary,
              transition: 'all 0.2s ease',
              ...(selectedDietary === null ? {
                background: colors.semantic.success,
                color: colors.text.inverse
              } : {
                background: colors.surface.tertiary,
                color: colors.text.tertiary
              })
            }}
          >
            All
          </button>
          <button
            onClick={() => setSelectedDietary(DietaryType.VEGETARIAN)}
            style={{
              padding: `${spacing[1]} ${spacing[3]}`,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              fontFamily: typography.fontFamily.primary,
              transition: 'all 0.2s ease',
              ...(selectedDietary === DietaryType.VEGETARIAN ? {
                background: colors.semantic.success,
                color: colors.text.inverse
              } : {
                background: colors.surface.tertiary,
                color: colors.text.tertiary
              })
            }}
          >
            🌿 Veg
          </button>
          <button
            onClick={() => setSelectedDietary(DietaryType.VEGAN)}
            style={{
              padding: `${spacing[1]} ${spacing[3]}`,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              fontFamily: typography.fontFamily.primary,
              transition: 'all 0.2s ease',
              ...(selectedDietary === DietaryType.VEGAN ? {
                background: colors.semantic.successLight,
                color: colors.text.primary
              } : {
                background: colors.surface.tertiary,
                color: colors.text.tertiary
              })
            }}
          >
            🌱 Vegan
          </button>
          <button
            onClick={() => setSelectedDietary(DietaryType.NON_VEGETARIAN)}
            style={{
              padding: `${spacing[1]} ${spacing[3]}`,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              fontFamily: typography.fontFamily.primary,
              transition: 'all 0.2s ease',
              ...(selectedDietary === DietaryType.NON_VEGETARIAN ? {
                background: colors.semantic.error,
                color: colors.text.inverse
              } : {
                background: colors.surface.tertiary,
                color: colors.text.tertiary
              })
            }}
          >
            🍖 Non-Veg
          </button>
        </div>
      </div>

      {/* Popular Items Quick Add */}
      {!searchTerm && selectedCategory === null && popularItems.length > 0 && (
        <div style={{
          padding: spacing[4],
          backgroundColor: colors.surface.secondary,
          borderBottom: `1px solid ${colors.surface.border}`
        }}>
          <p style={{
            margin: `0 0 ${spacing[3]} 0`,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary
          }}>
            🔥 Popular Items
          </p>
          <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
            {popularItems.map((item: any) => (
              <button
                key={item.id}
                onClick={() => onAddItem(item)}
                style={{
                  padding: `${spacing[2]} ${spacing[3]}`,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  fontFamily: typography.fontFamily.primary,
                  background: colors.semantic.info,
                  color: colors.text.inverse,
                  boxShadow: shadows.raised.sm,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = shadows.floating.md;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = shadows.raised.sm;
                }}
              >
                {item.name} ({CURRENCY.format(item.basePrice / 100)}) +
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items Grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: spacing[4] }}>
        {isLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing[10],
            color: colors.text.secondary
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: `4px solid ${colors.surface.border}`,
              borderTopColor: colors.brand.primary,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {error && (
          <Card
            elevation="sm"
            padding="lg"
            style={{
              background: `linear-gradient(135deg, ${colors.semantic.errorLight}22 0%, ${colors.semantic.error}11 100%)`,
              border: `2px solid ${colors.semantic.error}`,
              color: colors.text.primary,
              textAlign: 'center'
            }}
          >
            ❌ Failed to load menu items. Please try again.
          </Card>
        )}

        {!isLoading && !error && filteredItems.length === 0 && (
          <Card
            elevation="sm"
            padding="lg"
            style={{
              background: `linear-gradient(135deg, ${colors.semantic.infoLight}22 0%, ${colors.semantic.info}11 100%)`,
              border: `2px solid ${colors.semantic.info}`,
              color: colors.text.primary,
              textAlign: 'center'
            }}
          >
            ℹ️ {searchTerm
              ? 'No menu items found matching your search.'
              : 'No available items in this category.'}
          </Card>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: spacing[2]
        }}>
          {filteredItems.map((item: any) => (
            <Card
              key={item.id}
              elevation="sm"
              padding="sm"
              interactive
              onClick={() => onAddItem(item)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: `2px solid transparent`,
                position: 'relative',
                minHeight: '110px',
                maxHeight: '150px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.brand.primary;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Popular star badge */}
              {item.isRecommended && (
                <div style={{
                  position: 'absolute',
                  top: spacing[1],
                  right: spacing[1],
                  fontSize: '12px'
                }}>
                  ⭐
                </div>
              )}

              {/* Item name */}
              <div style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[1],
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: '1.3',
                minHeight: '2.6em',
                paddingRight: item.isRecommended ? '20px' : '0'
              }}>
                {item.name}
              </div>

              {/* Dietary icons - compact */}
              <div style={{
                display: 'flex',
                gap: spacing[1],
                marginBottom: spacing[1],
                fontSize: '10px'
              }}>
                {item.dietaryInfo?.includes(DietaryType.VEGETARIAN) && <span title="Vegetarian">🥬</span>}
                {item.dietaryInfo?.includes(DietaryType.VEGAN) && <span title="Vegan">🌱</span>}
                {item.dietaryInfo?.includes(DietaryType.NON_VEGETARIAN) && <span title="Non-Veg">🍖</span>}
                {item.spiceLevel && item.spiceLevel !== 'NONE' && <span title={item.spiceLevel}>🌶️</span>}
              </div>

              {/* Price */}
              <div style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.bold,
                color: colors.brand.primary,
                marginTop: 'auto',
                marginBottom: spacing[2]
              }}>
                {CURRENCY.format(item.basePrice / 100)}
              </div>

              {/* Add button - full width at bottom */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddItem(item);
                }}
                style={{
                  width: '100%',
                  height: '26px',
                  borderRadius: '6px',
                  border: 'none',
                  background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.secondary} 100%)`,
                  color: colors.text.inverse,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  boxShadow: shadows.raised.sm,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = shadows.floating.sm;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = shadows.raised.sm;
                }}
              >
                + Add
              </button>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer with item count */}
      <div style={{
        padding: spacing[3],
        borderTop: `2px solid ${colors.surface.border}`,
        backgroundColor: colors.surface.secondary,
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
        fontWeight: typography.fontWeight.medium,
        textAlign: 'center'
      }}>
        📊 {filteredItems.length} items available • {selectedCuisine.replace(/_/g, ' ')}
        {selectedCategory && ` • ${selectedCategory.replace(/_/g, ' ')}`}
        {selectedDietary && ` • ${selectedDietary}`}
      </div>
    </div>
  );
};

export default MenuPanel;
