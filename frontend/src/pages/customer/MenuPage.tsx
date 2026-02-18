import React, { useState, useEffect } from 'react';
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
      case DietaryType.VEGETARIAN: return '#2e7d32';
      case DietaryType.VEGAN: return '#1b5e20';
      case DietaryType.NON_VEGETARIAN: return 'var(--red)';
      case DietaryType.JAIN: return '#f57f17';
      case DietaryType.HALAL: return '#1565c0';
      default: return 'var(--text-3)';
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

  // ── Dark design styles ──────────────────────────────────────
  const searchInputStyles: React.CSSProperties = {
    width: '100%',
    padding: '12px 20px',
    fontSize: '0.95rem',
    color: 'var(--text-1)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-pill)',
    outline: 'none',
    fontFamily: 'var(--font-body)',
  };

  const filterSectionStyles: React.CSSProperties = {
    padding: '24px',
    marginBottom: '24px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-card)',
  };

  const filterGroupStyles: React.CSSProperties = { marginBottom: '20px' };

  const filterLabelStyles: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'var(--text-3)',
    marginBottom: '10px',
    display: 'block',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  };

  const filterButtonContainerStyles: React.CSSProperties = { display: 'flex', flexWrap: 'wrap' as const, gap: '8px' };

  const getFilterButtonStyles = (isActive: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    fontSize: '0.8rem',
    fontWeight: 500,
    color: isActive ? 'var(--gold)' : 'var(--text-2)',
    background: isActive ? 'rgba(212,168,67,0.12)' : 'var(--surface-2)',
    border: `1px solid ${isActive ? 'var(--gold)' : 'var(--border)'}`,
    borderRadius: 'var(--radius-pill)',
    cursor: 'pointer',
    transition: 'var(--transition)',
    fontFamily: 'var(--font-body)',
  });

  const menuGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  };

  const menuCardStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column' as const,
    background: 'var(--surface)',
    borderRadius: 'var(--radius-card)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    height: '100%',
    transition: 'var(--transition)',
  };

  const menuImageStyles: React.CSSProperties = {
    width: '100%',
    height: '180px',
    objectFit: 'cover' as const,
    backgroundColor: 'var(--surface-2)',
  };

  const menuContentStyles: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column' as const, padding: '16px' };

  const menuHeaderStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  };

  const menuNameStyles: React.CSSProperties = {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--text-1)',
    margin: 0,
    fontFamily: 'var(--font-body)',
  };

  const recommendedBadgeStyles: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 700,
    background: 'rgba(212,168,67,0.15)',
    color: 'var(--gold)',
    border: '1px solid var(--gold)',
    borderRadius: 'var(--radius-pill)',
    padding: '2px 8px',
    flexShrink: 0,
  };

  const descriptionStyles: React.CSSProperties = {
    fontSize: '0.78rem',
    color: 'var(--text-3)',
    marginBottom: '12px',
    lineHeight: 1.5,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
  };

  const tagsContainerStyles: React.CSSProperties = { display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '10px' };

  const getDietaryBadgeStyles = (dietary: DietaryType): React.CSSProperties => ({
    display: 'inline-flex',
    padding: '2px 8px',
    fontSize: '0.7rem',
    fontWeight: 600,
    backgroundColor: getDietaryColor(dietary),
    color: '#fff',
    borderRadius: 'var(--radius-pill)',
  });

  const prepTimeStyles: React.CSSProperties = { fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '10px' };

  const priceRowStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: '12px',
    borderTop: '1px solid var(--border)',
  };

  const priceStyles: React.CSSProperties = {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--gold)',
    fontFamily: 'var(--font-body)',
  };

  const quantityControlStyles: React.CSSProperties = { display: 'flex', gap: '6px', alignItems: 'center' };

  const quantityButtonStyles: React.CSSProperties = {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border)',
    borderRadius: '50%',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '1rem',
    color: 'var(--text-1)',
    background: 'var(--surface-2)',
    transition: 'var(--transition)',
  };

  const quantityDisplayStyles: React.CSSProperties = {
    minWidth: '24px',
    textAlign: 'center' as const,
    fontWeight: 700,
    fontSize: '0.875rem',
    color: 'var(--text-1)',
  };

  const getAddButtonStyles = (inCart: boolean, _disabled: boolean): React.CSSProperties => ({
    background: inCart ? '#2e7d32' : 'var(--red)',
    padding: '6px 14px',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-pill)',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    transition: 'var(--transition)',
  });

  const recipeButtonStyles: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'var(--text-2)',
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-pill)',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    transition: 'var(--transition)',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    width: '100%',
    justifyContent: 'center',
  };

  const variantsNoteStyles: React.CSSProperties = {
    fontSize: '0.72rem',
    color: 'var(--text-3)',
    fontStyle: 'italic',
    marginTop: '6px',
  };

  const loadingStyles: React.CSSProperties = {
    textAlign: 'center' as const,
    padding: '64px',
    fontSize: '1.1rem',
    color: 'var(--text-2)',
  };

  const emptyStateStyles: React.CSSProperties = {
    textAlign: 'center' as const,
    padding: '64px',
    fontSize: '1.1rem',
    color: 'var(--text-2)',
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
      <AppHeader
        hideStaffLogin={hideStaffLogin}
        showPublicNav={showPublicNav}
        onCartClick={onCartClick}
      />

      <div style={{ display: 'flex' }}>
        {/* Left sidebar */}
        <div style={{
          width: '260px',
          flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          padding: '24px 20px',
          position: 'sticky',
          top: '64px',
          height: 'calc(100vh - 64px)',
          overflowY: 'auto',
        }}>
          <StoreSelector />
          <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />
          <div style={filterGroupStyles}>
            <label style={filterLabelStyles}>Cuisine</label>
            <div style={{ ...filterButtonContainerStyles, flexDirection: 'column', gap: '6px' }}>
              {Object.values(Cuisine).map((cuisine) => (
                <button
                  key={cuisine}
                  style={{ ...getFilterButtonStyles(selectedCuisine === cuisine), textAlign: 'left', width: '100%', borderRadius: '8px' }}
                  onClick={() => { setSelectedCuisine(cuisine); setSelectedCategory(null); }}
                >
                  {cuisine.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {availableCategories.length > 0 && (
            <div style={filterGroupStyles}>
              <label style={filterLabelStyles}>Category</label>
              <div style={{ ...filterButtonContainerStyles, flexDirection: 'column', gap: '6px' }}>
                {availableCategories.map((category) => (
                  <button
                    key={category}
                    style={{ ...getFilterButtonStyles(selectedCategory === category), textAlign: 'left', width: '100%', borderRadius: '8px' }}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={filterGroupStyles}>
            <label style={filterLabelStyles}>Dietary</label>
            <div style={{ ...filterButtonContainerStyles, flexDirection: 'column', gap: '6px' }}>
              {[
                { label: 'All', value: null },
                { label: 'Vegetarian', value: DietaryType.VEGETARIAN },
                { label: 'Vegan', value: DietaryType.VEGAN },
                { label: 'Non-Veg', value: DietaryType.NON_VEGETARIAN },
                { label: 'Jain', value: DietaryType.JAIN },
              ].map(opt => (
                <button
                  key={opt.label}
                  style={{ ...getFilterButtonStyles(selectedDietary === opt.value), textAlign: 'left', width: '100%', borderRadius: '8px' }}
                  onClick={() => setSelectedDietary(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '24px 28px' }}>
          {/* Search bar */}
          <div style={{ marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="Search for dishes..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              style={searchInputStyles}
              onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; }}
              onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
            />
          </div>

          {/* Section heading */}
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1.5rem',
            color: 'var(--text-1)',
            marginBottom: '4px',
          }}>
            {selectedCuisine.replace(/_/g, ' ')}
            {selectedCategory ? ` — ${selectedCategory.replace(/_/g, ' ')}` : ''}
          </h2>
          <div style={{ height: '1px', background: 'linear-gradient(to right, var(--gold), transparent)', marginBottom: '20px' }} />

          {/* Menu Items */}
      {isLoading ? (
        <div style={loadingStyles}>Loading delicious menu...</div>
      ) : filteredMenu.length === 0 ? (
        <div style={emptyStateStyles}>No items found. Try adjusting your filters.</div>
      ) : (
        <div style={menuGridStyles}>
          {filteredMenu.map((item) => (
            <div
              key={item.id}
              style={menuCardStyles}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card-hover)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
            >
              {/* Image area */}
              <div style={{ height: '180px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', position: 'relative', overflow: 'hidden' }}>
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.name} style={menuImageStyles} />
                  : <span>🍽️</span>
                }
              </div>

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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.7rem', color: 'var(--red-light)', fontWeight: '600' }}>
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
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
                >
                  <span>View Recipe & Ingredients</span>
                </button>

                {item.variants && item.variants.length > 0 && (
                  <div style={variantsNoteStyles}>
                    + {item.variants.length} size options available
                  </div>
                )}

                {/* Price + controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={priceRowStyles}>
                    <span style={priceStyles}>{formatPrice(item.basePrice)}</span>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={quantityControlStyles}>
                      <button
                        style={quantityButtonStyles}
                        onClick={() => decrementQuantity(item.id)}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLElement).style.color = 'var(--gold)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'; }}
                      >
                        −
                      </button>
                      <div style={quantityDisplayStyles}>{getQuantity(item.id)}</div>
                      <button
                        style={{ ...quantityButtonStyles, background: 'var(--red)', border: '1px solid var(--red)', color: '#fff' }}
                        onClick={() => incrementQuantity(item.id)}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red-light)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--red)'; }}
                      >
                        +
                      </button>
                    </div>
                    <button
                      style={{ ...getAddButtonStyles(isItemInCart(item.id), false), flex: '0 1 auto', whiteSpace: 'nowrap' as const }}
                      onClick={() => handleAddToCart(item)}
                      onMouseEnter={(e) => { if (!isItemInCart(item.id)) (e.currentTarget as HTMLElement).style.background = 'var(--red-light)'; }}
                      onMouseLeave={(e) => { if (!isItemInCart(item.id)) (e.currentTarget as HTMLElement).style.background = 'var(--red)'; }}
                    >
                      {isItemInCart(item.id) ? '✓ In Cart' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}

        </div>{/* end main content */}
      </div>{/* end flex row */}

      {/* Recipe Viewer Modal */}
      {selectedRecipeItem && (
        <RecipeViewer
          menuItem={selectedRecipeItem}
          onClose={() => setSelectedRecipeItem(null)}
        />
      )}
    </div>
  );
};

export default MenuPage;
