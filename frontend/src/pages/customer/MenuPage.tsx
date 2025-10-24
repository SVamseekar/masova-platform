import React, { useState } from 'react';
import { colors, spacing, typography, shadows, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface, createCard, createBadge } from '../../styles/neumorphic-utils';
import {
  useGetAvailableMenuQuery,
  useLazySearchMenuQuery,
  Cuisine,
  MenuCategory,
  MenuItem,
  DietaryType,
  SpiceLevel,
} from '../../store/api/menuApi';
import { useAppDispatch } from '../../store/hooks';
import { addToCart } from '../../store/slices/cartSlice';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';

interface MenuPageProps {
  hideStaffLogin?: boolean;  // Pass through to AppHeader for public pages
  showPublicNav?: boolean;   // Show Home, Offers, Cart buttons in header
  onCartClick?: () => void;  // Handler for cart button click
}

const MenuPage: React.FC<MenuPageProps> = ({
  hideStaffLogin = false,
  showPublicNav = false,
  onCartClick
}) => {
  const [selectedCuisine, setSelectedCuisine] = useState<Cuisine>(Cuisine.SOUTH_INDIAN);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDietary, setSelectedDietary] = useState<DietaryType | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Category mappings based on cuisine
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

  const dispatch = useAppDispatch();

  // Always fetch all menu items
  const { data: allMenu, isLoading: loadingAll } = useGetAvailableMenuQuery();
  const [searchMenu, { data: searchResults, isLoading: loadingSearch }] = useLazySearchMenuQuery();

  // Use search results if searching, otherwise use all menu
  let menuItems = searchTerm ? (searchResults || []) : (allMenu || []);

  const isLoading = loadingAll || loadingSearch;

  // Filter by cuisine, category, and dietary preferences
  const filteredMenu = menuItems.filter((item) => {
    if (item.cuisine !== selectedCuisine) return false;
    if (selectedCategory !== null && item.category !== selectedCategory) return false;
    if (selectedDietary && !item.dietaryInfo?.includes(selectedDietary)) return false;
    return true;
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim().length >= 2) {
      searchMenu(value.trim());
    }
  };

  const getQuantity = (itemId: string) => quantities[itemId] || 1;

  const incrementQuantity = (itemId: string) => {
    setQuantities(prev => ({ ...prev, [itemId]: (prev[itemId] || 1) + 1 }));
  };

  const decrementQuantity = (itemId: string) => {
    setQuantities(prev => ({ ...prev, [itemId]: Math.max(1, (prev[itemId] || 1) - 1) }));
  };

  const [addedToCartItem, setAddedToCartItem] = useState<string | null>(null);

  const handleAddToCart = (item: MenuItem) => {
    const quantity = getQuantity(item.id);
    dispatch(addToCart({
      id: item.id,
      name: item.name,
      price: item.basePrice / 100,
      quantity,
      imageUrl: item.imageUrl,
      category: item.category,
    }));

    // Show feedback
    setAddedToCartItem(item.id);
    setTimeout(() => setAddedToCartItem(null), 2000);

    // Reset quantity after adding
    setQuantities(prev => ({ ...prev, [item.id]: 1 }));
  };

  const formatPrice = (priceInPaise: number) => {
    return `₹${(priceInPaise / 100).toFixed(2)}`;
  };

  const getDietaryColor = (dietary: DietaryType): string => {
    switch (dietary) {
      case DietaryType.VEGETARIAN:
        return colors.semantic.success;
      case DietaryType.VEGAN:
        return colors.semantic.successLight;
      case DietaryType.NON_VEGETARIAN:
        return colors.semantic.error;
      case DietaryType.JAIN:
        return colors.semantic.warning;
      case DietaryType.HALAL:
        return colors.brand.secondary;
      default:
        return colors.text.secondary;
    }
  };

  const getSpiceLevelEmoji = (spiceLevel?: SpiceLevel) => {
    switch (spiceLevel) {
      case SpiceLevel.MILD:
        return '🌶️';
      case SpiceLevel.MEDIUM:
        return '🌶️🌶️';
      case SpiceLevel.HOT:
        return '🌶️🌶️🌶️';
      case SpiceLevel.EXTRA_HOT:
        return '🌶️🌶️🌶️🌶️';
      default:
        return '';
    }
  };

  // Styles
  const containerStyles: React.CSSProperties = {
    fontFamily: typography.fontFamily.primary,
    position: 'relative',
    minHeight: '100vh',
    padding: spacing[8],
    zIndex: 1,
  };

  const headerStyles: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: spacing[10],
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['5xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text.primary,
    marginBottom: spacing[3],
    background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  };

  const searchContainerStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'lg', '2xl'),
    padding: spacing[6],
    marginBottom: spacing[8],
  };

  const searchInputStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'base', 'lg'),
    width: '100%',
    padding: `${spacing[4]} ${spacing[5]}`,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    backgroundColor: colors.surface.primary,
    border: 'none',
    outline: 'none',
    fontFamily: typography.fontFamily.primary,
  };

  const filterSectionStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'lg', '2xl'),
    padding: spacing[6],
    marginBottom: spacing[8],
  };

  const filterGroupStyles: React.CSSProperties = {
    marginBottom: spacing[6],
  };

  const filterLabelStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[3],
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  };

  const filterButtonContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing[3],
  };

  const getFilterButtonStyles = (isActive: boolean): React.CSSProperties => ({
    ...createNeumorphicSurface(isActive ? 'inset' : 'raised', 'base', 'lg'),
    padding: `${spacing[3]} ${spacing[5]}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: isActive ? colors.brand.primary : colors.text.primary,
    backgroundColor: isActive ? colors.brand.primaryLight + '20' : colors.surface.primary,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: typography.fontFamily.primary,
  });

  const menuGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: spacing[6],
  };

  const menuCardStyles: React.CSSProperties = {
    ...createCard('md', 'base', true),
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  };

  const menuImageStyles: React.CSSProperties = {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
  };

  const menuContentStyles: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  };

  const menuHeaderStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  };

  const menuNameStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    margin: 0,
  };

  const recommendedBadgeStyles: React.CSSProperties = {
    ...createBadge('warning', 'sm'),
    fontSize: typography.fontSize.xs,
  };

  const descriptionStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing[4],
    lineHeight: typography.lineHeight.relaxed,
  };

  const tagsContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[3],
  };

  const getDietaryBadgeStyles = (dietary: DietaryType): React.CSSProperties => ({
    display: 'inline-flex',
    padding: `${spacing[1]} ${spacing[2]}`,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    backgroundColor: getDietaryColor(dietary),
    color: colors.text.inverse,
    borderRadius: borderRadius.base,
    boxShadow: shadows.raised.sm,
  });

  const spiceBadgeStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
  };

  const prepTimeStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing[3],
  };

  const priceRowStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: spacing[4],
    borderTop: `1px solid ${colors.surface.tertiary}`,
  };

  const priceStyles: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.extrabold,
    background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const quantityControlStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing[2],
    alignItems: 'center',
  };

  const quantityButtonStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'sm', 'md'),
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.lg,
    color: colors.brand.primary,
    backgroundColor: colors.surface.primary,
    transition: 'all 0.2s ease',
  };

  const quantityDisplayStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'md'),
    minWidth: '50px',
    padding: `${spacing[2]} ${spacing[3]}`,
    textAlign: 'center',
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  };

  const addButtonStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'base', 'lg'),
    background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.primaryLight} 100%)`,
    padding: `${spacing[3]} ${spacing[6]}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    border: 'none',
    cursor: 'pointer',
    fontFamily: typography.fontFamily.primary,
    transition: 'all 0.3s ease',
  };

  const variantsNoteStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: spacing[2],
  };

  const loadingStyles: React.CSSProperties = {
    textAlign: 'center',
    padding: spacing[16],
    fontSize: typography.fontSize.xl,
    color: colors.text.secondary,
  };

  const emptyStateStyles: React.CSSProperties = {
    textAlign: 'center',
    padding: spacing[16],
    fontSize: typography.fontSize.xl,
    color: colors.text.secondary,
  };

  return (
    <>
      {/* Animated Background */}
      <AnimatedBackground variant="default" />

      <div style={containerStyles}>
        <AppHeader
          title="Browse Our Menu"
          hideStaffLogin={hideStaffLogin}
          showPublicNav={showPublicNav}
          onCartClick={onCartClick}
        />

      {/* Search Bar */}
      <div style={searchContainerStyles}>
        <input
          type="text"
          placeholder="Search for dishes..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          style={searchInputStyles}
        />
      </div>

      {/* Filters */}
      <div style={filterSectionStyles}>
        {/* Cuisine Filter */}
        <div style={filterGroupStyles}>
          <label style={filterLabelStyles}>Cuisine:</label>
          <div style={filterButtonContainerStyles}>
            {Object.values(Cuisine).map((cuisine) => (
              <button
                key={cuisine}
                style={getFilterButtonStyles(selectedCuisine === cuisine)}
                onClick={() => {
                  setSelectedCuisine(cuisine);
                  setSelectedCategory(null);
                }}
              >
                {cuisine.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        {availableCategories.length > 0 && (
          <div style={filterGroupStyles}>
            <label style={filterLabelStyles}>
              Category ({selectedCuisine.replace(/_/g, ' ')}):
            </label>
            <div style={filterButtonContainerStyles}>
              {availableCategories.map((category) => (
                <button
                  key={category}
                  style={getFilterButtonStyles(selectedCategory === category)}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dietary Filter */}
        <div style={{ ...filterGroupStyles, marginBottom: 0 }}>
          <label style={filterLabelStyles}>Dietary:</label>
          <div style={filterButtonContainerStyles}>
            <button
              style={getFilterButtonStyles(selectedDietary === null)}
              onClick={() => setSelectedDietary(null)}
            >
              All
            </button>
            <button
              style={getFilterButtonStyles(selectedDietary === DietaryType.VEGETARIAN)}
              onClick={() => setSelectedDietary(DietaryType.VEGETARIAN)}
            >
              Vegetarian
            </button>
            <button
              style={getFilterButtonStyles(selectedDietary === DietaryType.VEGAN)}
              onClick={() => setSelectedDietary(DietaryType.VEGAN)}
            >
              Vegan
            </button>
            <button
              style={getFilterButtonStyles(selectedDietary === DietaryType.NON_VEGETARIAN)}
              onClick={() => setSelectedDietary(DietaryType.NON_VEGETARIAN)}
            >
              Non-Veg
            </button>
            <button
              style={getFilterButtonStyles(selectedDietary === DietaryType.JAIN)}
              onClick={() => setSelectedDietary(DietaryType.JAIN)}
            >
              Jain
            </button>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      {isLoading ? (
        <div style={loadingStyles}>Loading delicious menu...</div>
      ) : filteredMenu.length === 0 ? (
        <div style={emptyStateStyles}>No items found. Try adjusting your filters.</div>
      ) : (
        <div style={menuGridStyles}>
          {filteredMenu.map((item) => (
            <div key={item.id} style={menuCardStyles}>
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.name} style={menuImageStyles} />
              )}

              <div style={menuContentStyles}>
                <div style={menuHeaderStyles}>
                  <h3 style={menuNameStyles}>{item.name}</h3>
                  {item.isRecommended && (
                    <span style={recommendedBadgeStyles}>⭐ Recommended</span>
                  )}
                </div>

                {item.description && (
                  <p style={descriptionStyles}>{item.description}</p>
                )}

                <div style={tagsContainerStyles}>
                  {item.dietaryInfo?.map((dietary) => (
                    <span key={dietary} style={getDietaryBadgeStyles(dietary)}>
                      {dietary}
                    </span>
                  ))}
                  {item.spiceLevel && item.spiceLevel !== SpiceLevel.NONE && (
                    <span style={spiceBadgeStyles}>{getSpiceLevelEmoji(item.spiceLevel)}</span>
                  )}
                </div>

                {item.preparationTime && (
                  <div style={prepTimeStyles}>⏱️ {item.preparationTime} mins</div>
                )}

                {item.variants && item.variants.length > 0 && (
                  <div style={variantsNoteStyles}>
                    + {item.variants.length} size options available
                  </div>
                )}

                <div style={priceRowStyles}>
                  <span style={priceStyles}>{formatPrice(item.basePrice)}</span>

                  <div style={quantityControlStyles}>
                    <button
                      style={quantityButtonStyles}
                      onClick={() => decrementQuantity(item.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = shadows.raised.md;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = shadows.raised.sm;
                      }}
                    >
                      −
                    </button>
                    <div style={quantityDisplayStyles}>{getQuantity(item.id)}</div>
                    <button
                      style={quantityButtonStyles}
                      onClick={() => incrementQuantity(item.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = shadows.raised.md;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = shadows.raised.sm;
                      }}
                    >
                      +
                    </button>
                    <button
                      style={{
                        ...addButtonStyles,
                        ...(addedToCartItem === item.id ? {
                          background: `linear-gradient(135deg, ${colors.semantic.success} 0%, ${colors.semantic.successLight} 100%)`,
                        } : {})
                      }}
                      onClick={() => handleAddToCart(item)}
                      onMouseEnter={(e) => {
                        if (addedToCartItem !== item.id) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = shadows.raised.lg;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (addedToCartItem !== item.id) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = shadows.raised.base;
                        }
                      }}
                    >
                      {addedToCartItem === item.id ? '✓ Added!' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MenuPage;
