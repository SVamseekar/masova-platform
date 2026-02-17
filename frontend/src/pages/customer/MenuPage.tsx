import React, { useState, useEffect } from 'react';
import { colors, spacing, typography, shadows, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface, createCard, createBadge } from '../../styles/neumorphic-utils';
import {
  useGetAvailableMenuQuery,
  Cuisine,
  MenuCategory,
  MenuItem,
  DietaryType,
  SpiceLevel,
} from '../../store/api/menuApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addToCart, updateItemQuantity, selectCartItems, selectSelectedStoreId } from '../../store/slices/cartSlice';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import RecipeViewer from '../../components/RecipeViewer';
import StoreSelector from '../../components/StoreSelector';

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
  const [selectedRecipeItem, setSelectedRecipeItem] = useState<MenuItem | null>(null);

  const cartItems = useAppSelector(selectCartItems);
  const selectedStoreId = useAppSelector(selectSelectedStoreId);

  // Sync menu quantities with cart
  useEffect(() => {
    const newQuantities: Record<string, number> = {};
    cartItems.forEach(item => {
      newQuantities[item.id] = item.quantity;
    });
    setQuantities(newQuantities);
  }, [cartItems]);

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
  const { data: allMenu, isLoading } = useGetAvailableMenuQuery();

  // Filter by search term client-side
  let rawMenuItems = allMenu || [];
  if (searchTerm && searchTerm.trim().length >= 2) {
    const searchLower = searchTerm.toLowerCase();
    rawMenuItems = rawMenuItems.filter(item =>
      item.name.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower)
    );
  }

  // Filter by store first (to avoid duplicates across stores)
  let menuItems = rawMenuItems;
  if (selectedStoreId) {
    menuItems = menuItems.filter(item => item.storeId === selectedStoreId);
  } else {
    // If no store selected, deduplicate by name
    const uniqueItems = new Map<string, MenuItem>();
    menuItems.forEach(item => {
      if (!uniqueItems.has(item.name)) {
        uniqueItems.set(item.name, item);
      }
    });
    menuItems = Array.from(uniqueItems.values());
  }

  // Filter by cuisine, category, and dietary preferences
  const filteredMenu = menuItems.filter((item) => {
    if (item.cuisine !== selectedCuisine) return false;
    if (selectedCategory !== null && item.category !== selectedCategory) return false;
    if (selectedDietary && !item.dietaryInfo?.includes(selectedDietary)) return false;
    return true;
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  // Helper to check if item is in cart
  const isItemInCart = (itemId: string) => cartItems.some(item => item.id === itemId);

  const getQuantity = (itemId: string) => {
    // If item is in cart, get quantity from cart, otherwise default to 0
    const cartItem = cartItems.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : (quantities[itemId] || 0);
  };

  const incrementQuantity = (itemId: string) => {
    const cartItem = cartItems.find(item => item.id === itemId);
    if (cartItem) {
      // Update cart quantity
      dispatch(updateItemQuantity({ id: itemId, quantity: cartItem.quantity + 1 }));
    } else {
      // Just update local state for items not yet in cart, starting from 0
      setQuantities(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    }
  };

  const decrementQuantity = (itemId: string) => {
    const cartItem = cartItems.find(item => item.id === itemId);
    if (cartItem) {
      // Update cart quantity, minimum 1 for items in cart
      dispatch(updateItemQuantity({ id: itemId, quantity: Math.max(1, cartItem.quantity - 1) }));
    } else {
      // Just update local state for items not yet in cart, can go to 0
      setQuantities(prev => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] || 0) - 1) }));
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    let quantity = getQuantity(item.id);

    // Don't add if already in cart - user should use quantity controls
    if (isItemInCart(item.id)) {
      return;
    }

    // If quantity is 0, default to 1
    if (quantity === 0) {
      quantity = 1;
    }

    // Add to cart
    dispatch(addToCart({
      id: item.id,
      name: item.name,
      price: item.basePrice / 100,
      quantity,
      imageUrl: item.imageUrl,
      category: item.category,
    }));

    // Don't reset quantity - it will stay synced with cart
    // Green state will persist while item is in cart
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

  const getSpiceLevelDots = (spiceLevel?: SpiceLevel): { count: number; label: string } => {
    switch (spiceLevel) {
      case SpiceLevel.MILD: return { count: 1, label: 'Mild' };
      case SpiceLevel.MEDIUM: return { count: 2, label: 'Medium' };
      case SpiceLevel.HOT: return { count: 3, label: 'Hot' };
      case SpiceLevel.EXTRA_HOT: return { count: 4, label: 'Extra Hot' };
      default: return { count: 0, label: '' };
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

  // DEEP inset search input for prominent concave effect
  const searchInputStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'lg', 'xl'),  // Enhanced from 'base', 'lg'
    width: '100%',
    padding: `${spacing[5]} ${spacing[6]}`,  // More generous padding
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    backgroundColor: colors.surface.primary,
    border: 'none',
    outline: 'none',
    fontFamily: typography.fontFamily.primary,
  };

  // More prominent filter section
  const filterSectionStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'xl', '2xl'),  // Enhanced from 'lg'
    padding: spacing[8],  // More generous
    marginBottom: spacing[8],
    border: `1px solid ${colors.surface.border}`,  // Add definition
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

  // Larger elevation menu cards
  const menuCardStyles: React.CSSProperties = {
    ...createCard('xl', 'lg', true),  // Enhanced from 'md', 'base'
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${colors.surface.border}`,  // Add definition
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

  // PROMINENT quantity buttons - larger touch targets with deep press
  const quantityButtonStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'md', 'lg'),  // Enhanced from 'sm', 'md'
    width: '44px',  // Larger from 36px
    height: '44px',
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

  const getAddButtonStyles = (inCart: boolean, disabled: boolean): React.CSSProperties => ({
    ...createNeumorphicSurface('raised', 'base', 'lg'),
    background: disabled
      ? colors.surface.tertiary
      : inCart
        ? `linear-gradient(135deg, ${colors.semantic.success} 0%, ${colors.semantic.successLight} 100%)`
        : `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.primaryLight} 100%)`,
    padding: `${spacing[3]} ${spacing[6]}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: disabled ? colors.text.tertiary : colors.text.inverse,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: typography.fontFamily.primary,
    transition: 'all 0.3s ease',
    opacity: disabled ? 0.5 : 1,
  });

  const recipeButtonStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'sm', 'lg'),
    padding: `${spacing[2]} ${spacing[4]}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand.secondary,
    backgroundColor: colors.surface.primary,
    border: 'none',
    cursor: 'pointer',
    fontFamily: typography.fontFamily.primary,
    transition: 'all 0.2s ease',
    marginBottom: spacing[3],
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    width: '100%',
    justifyContent: 'center',
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

      {/* Store Selector and Search Bar */}
      <div style={{ display: 'flex', gap: spacing[4], marginBottom: spacing[6], alignItems: 'center', justifyContent: 'space-between' }}>
        <StoreSelector />
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search for dishes..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            style={searchInputStyles}
          />
        </div>
      </div>

      {/* Original Search Container Removed - Replaced above */}
      <div style={{ ...searchContainerStyles, display: 'none' }}>
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
                    <span style={recommendedBadgeStyles}>Recommended</span>
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
                  {item.spiceLevel && item.spiceLevel !== SpiceLevel.NONE && (() => {
                    const { count, label } = getSpiceLevelDots(item.spiceLevel);
                    return count > 0 ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: typography.fontSize.xs, color: '#e53e3e', fontWeight: '600' }}>
                        {Array.from({ length: count }).map((_, i) => (
                          <span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e53e3e', display: 'inline-block' }} />
                        ))}
                        <span style={{ marginLeft: '4px' }}>{label}</span>
                      </span>
                    ) : null;
                  })()}
                </div>

                {item.preparationTime && (
                  <div style={prepTimeStyles}>{item.preparationTime} min prep</div>
                )}

                {/* View Recipe Button */}
                <button
                  style={recipeButtonStyles}
                  onClick={() => setSelectedRecipeItem(item)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = shadows.raised.md;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = shadows.raised.sm;
                  }}
                >
                  <span>View Recipe & Ingredients</span>
                </button>

                {item.variants && item.variants.length > 0 && (
                  <div style={variantsNoteStyles}>
                    + {item.variants.length} size options available
                  </div>
                )}

                {/* Price on left, Quantity controls below */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing[3],
                }}>
                  <div style={priceRowStyles}>
                    <span style={priceStyles}>{formatPrice(item.basePrice)}</span>
                  </div>

                  {/* Quantity controls and Add to Cart side by side */}
                  <div style={{
                    display: 'flex',
                    gap: spacing[3],
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={quantityControlStyles}>
                      <button
                        style={quantityButtonStyles}
                        onClick={() => decrementQuantity(item.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = shadows.raised.lg;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = shadows.raised.md;
                        }}
                        onMouseDown={(e) => {
                          e.currentTarget.style.boxShadow = shadows.inset.lg;  // DEEP press
                        }}
                        onMouseUp={(e) => {
                          e.currentTarget.style.boxShadow = shadows.raised.lg;
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
                          e.currentTarget.style.boxShadow = shadows.raised.lg;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = shadows.raised.md;
                        }}
                        onMouseDown={(e) => {
                          e.currentTarget.style.boxShadow = shadows.inset.lg;  // DEEP press
                        }}
                        onMouseUp={(e) => {
                          e.currentTarget.style.boxShadow = shadows.raised.lg;
                        }}
                      >
                        +
                      </button>
                    </div>
                    <button
                      style={{
                        ...getAddButtonStyles(isItemInCart(item.id), false),
                        flex: '0 1 auto',
                        whiteSpace: 'nowrap',
                      }}
                      onClick={() => handleAddToCart(item)}
                      onMouseEnter={(e) => {
                        if (!isItemInCart(item.id)) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = shadows.raised.lg;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isItemInCart(item.id)) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = shadows.raised.base;
                        }
                      }}
                    >
                      {isItemInCart(item.id) ? '✓ In Cart' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}

        {/* Recipe Viewer Modal */}
        {selectedRecipeItem && (
          <RecipeViewer
            menuItem={selectedRecipeItem}
            onClose={() => setSelectedRecipeItem(null)}
          />
        )}
      </div>
    </>
  );
};

export default MenuPage;
