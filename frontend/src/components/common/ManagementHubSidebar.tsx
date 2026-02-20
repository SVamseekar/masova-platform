import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectSelectedStoreId } from '../../store/slices/cartSlice';
import { logout } from '../../store/slices/authSlice';
import { colors, shadows, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';

interface ManagementHubSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManagementHubSidebar: React.FC<ManagementHubSidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const selectedStoreId = useAppSelector(selectSelectedStoreId);
  const storeId = selectedStoreId || '';

  const [managementSearchQuery, setManagementSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Management page categories
  const managementCategories = [
    {
      title: 'Orders & Payments',
      icon: '💰',
      color: colors.semantic.success,
      items: [
        { path: '/manager/orders', label: 'Order Management', icon: '📦', description: 'Track and manage all orders' },
        { path: '/manager/payments', label: 'Payments', icon: '💳', description: 'Payment processing & history' },
        { path: '/manager/refunds', label: 'Refunds', icon: '↩️', description: 'Handle refund requests' },
        { path: '/manager/deliveries', label: 'Deliveries', icon: '🚚', description: 'Delivery status tracking' },
      ]
    },
    {
      title: 'Inventory & Supply',
      icon: '📊',
      color: colors.semantic.info,
      items: [
        { path: '/manager/inventory', label: 'Inventory', icon: '📊', description: 'Stock levels & tracking' },
        { path: '/manager/suppliers', label: 'Suppliers', icon: '🏭', description: 'Manage supplier relationships' },
        { path: '/manager/purchase-orders', label: 'Purchase Orders', icon: '📋', description: 'Create & track POs' },
        { path: '/manager/waste-analysis', label: 'Waste Analysis', icon: '🗑️', description: 'Track waste & optimize' },
      ]
    },
    {
      title: 'Operations',
      icon: '⚙️',
      color: colors.brand.secondary,
      items: [
        { path: '/manager/recipes', label: 'Recipes', icon: '📖', description: 'Recipe management' },
        { path: `/pos?storeId=${storeId}`, label: 'POS System', icon: '🖥️', description: 'Point of sale access' },
        { path: '/manager/kiosk', label: 'Kiosk Terminals', icon: '🖥️', description: 'Manage POS kiosk terminals' },
        { path: '/manager/drivers', label: 'Drivers', icon: '🚗', description: 'Driver fleet management' },
        { path: '/manager/stores', label: 'Stores', icon: '🏪', description: 'Multi-store management' },
      ]
    },
    {
      title: 'People & Marketing',
      icon: '👥',
      color: colors.semantic.warning,
      items: [
        { path: '/manager/customers', label: 'Customers', icon: '👥', description: 'Customer database & insights' },
        { path: '/manager/staff', label: 'Staff', icon: '👔', description: 'Employee management' },
        { path: '/manager/staff-scheduling', label: 'Staff Scheduling', icon: '📅', description: 'Manage shifts & schedules' },
        { path: '/manager/campaigns', label: 'Campaigns', icon: '📢', description: 'Marketing campaigns' },
        { path: '/manager/reviews', label: 'Reviews', icon: '⭐', description: 'Customer reviews & ratings' },
      ]
    },
    {
      title: 'Analytics & Reports',
      icon: '📈',
      color: colors.brand.primary,
      items: [
        { path: '/manager/analytics', label: 'Analytics Dashboard', icon: '📈', description: 'Revenue trend & top products' },
        { path: '/manager/kitchen-analytics', label: 'Kitchen Analytics', icon: '🍳', description: 'Prep times & staff performance' },
        { path: '/manager/product-analytics', label: 'Product Analytics', icon: '📊', description: 'Menu item performance & trends' },
        { path: '/manager/advanced-reports', label: 'Advanced Reports', icon: '📑', description: 'Comprehensive business reports' },
        { path: '/manager/staff-leaderboard', label: 'Staff Leaderboard', icon: '🏆', description: 'Employee performance rankings' },
        { path: '/manager/equipment-monitoring', label: 'Equipment Status', icon: '⚙️', description: 'Kitchen equipment monitoring' },
      ]
    },
  ];

  const toggleCategory = (categoryTitle: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryTitle)) {
        newSet.delete(categoryTitle);
      } else {
        newSet.add(categoryTitle);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(managementCategories.map(cat => cat.title)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    onClose();
    dispatch(logout());
    navigate('/staff-login');
  };

  // Keyboard shortcut: ESC to close sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Filter categories based on search
  const filteredCategories = managementCategories.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.label.toLowerCase().includes(managementSearchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(managementSearchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: isOpen ? 'blur(4px)' : 'blur(0px)',
          zIndex: 9998,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease, backdrop-filter 0.3s ease',
          visibility: isOpen ? 'visible' : 'hidden'
        }}
      />

      {/* Management Pages Sidebar - Professional Design */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '400px',
        maxWidth: '90vw',
        backgroundColor: '#ffffff',
        boxShadow: isOpen ? '-2px 0 20px rgba(0, 0, 0, 0.1)' : '-2px 0 10px rgba(0, 0, 0, 0.05)',
        zIndex: 9999,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        willChange: 'transform',
        borderLeft: `1px solid ${colors.surface.border}`,
        borderTopLeftRadius: '24px',
        borderBottomLeftRadius: '24px',
        pointerEvents: isOpen ? 'auto' : 'none'
      }}>
        {/* Sidebar Header - Professional */}
        <div style={{
          padding: `${spacing[5]} ${spacing[6]}`,
          borderBottom: `1px solid ${colors.surface.border}`,
          backgroundColor: '#ffffff',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: spacing[4]
          }}>
            <div>
              <h3 style={{
                margin: '0 0 4px 0',
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                letterSpacing: '-0.02em'
              }}>
                Management
              </h3>
              <p style={{
                margin: '0',
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                lineHeight: '1.5'
              }}>
                Navigate to all management features
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: borderRadius.md,
                backgroundColor: 'transparent',
                border: `1px solid ${colors.surface.border}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                color: colors.text.secondary,
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.surface.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ✕
            </button>
          </div>

          {/* Search Bar */}
          <div style={{
            position: 'relative',
            marginBottom: spacing[3]
          }}>
            <div style={{
              position: 'absolute',
              left: spacing[3],
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: typography.fontSize.lg,
              color: colors.text.tertiary
            }}>
              🔍
            </div>
            <input
              type="text"
              placeholder="Search management pages..."
              value={managementSearchQuery}
              onChange={(e) => setManagementSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: `${spacing[3]} ${spacing[3]} ${spacing[3]} ${spacing[10]}`,
                border: `2px solid ${colors.surface.border}`,
                borderRadius: '12px',
                outline: 'none',
                backgroundColor: colors.surface.primary,
                fontSize: typography.fontSize.sm,
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

          {/* Expand/Collapse Buttons */}
          <div style={{
            display: 'flex',
            gap: spacing[2]
          }}>
            <button
              onClick={expandAll}
              style={{
                flex: 1,
                padding: `${spacing[2]} ${spacing[3]}`,
                border: 'none',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${colors.semantic.success}22 0%, ${colors.semantic.successDark}11 100%)`,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
                color: colors.semantic.success,
                cursor: 'pointer',
                boxShadow: shadows.raised.sm,
                transition: 'all 0.2s ease',
                fontFamily: typography.fontFamily.primary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = shadows.floating.md;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = shadows.raised.sm;
              }}
            >
              ⊕ Expand All
            </button>
            <button
              onClick={collapseAll}
              style={{
                flex: 1,
                padding: `${spacing[2]} ${spacing[3]}`,
                border: 'none',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${colors.semantic.error}22 0%, ${colors.semantic.errorLight}11 100%)`,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
                color: colors.semantic.error,
                cursor: 'pointer',
                boxShadow: shadows.raised.sm,
                transition: 'all 0.2s ease',
                fontFamily: typography.fontFamily.primary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = shadows.floating.md;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = shadows.raised.sm;
              }}
            >
              ⊖ Collapse All
            </button>
          </div>
        </div>

        {/* Sidebar Content - Categories */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: `${spacing[5]} ${spacing[6]}`,
          scrollbarWidth: 'thin',
          scrollbarColor: `${colors.brand.primary} ${colors.surface.border}`
        }}>
          {filteredCategories.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: `${spacing[10]} ${spacing[5]}`,
              color: colors.text.tertiary,
              fontSize: typography.fontSize.sm
            }}>
              No results found for "{managementSearchQuery}"
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div
                key={category.title}
                style={{
                  marginBottom: spacing[5]
                }}
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.title)}
                  style={{
                    ...createNeumorphicSurface('raised', 'sm', 'md'),
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: `${spacing[3]} ${spacing[4]}`,
                    marginBottom: spacing[3],
                    border: 'none',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${category.color}22 0%, ${category.color}11 100%)`,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontFamily: typography.fontFamily.primary
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                    e.currentTarget.style.boxShadow = shadows.floating.lg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = shadows.raised.sm;
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[3]
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `linear-gradient(135deg, ${category.color}22 0%, ${category.color}11 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: typography.fontSize.lg
                    }}>
                      {category.icon}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.bold,
                        color: colors.text.primary
                      }}>
                        {category.title}
                      </div>
                      <div style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.text.tertiary
                      }}>
                        {category.items.length} pages
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text.secondary,
                    transition: 'transform 0.3s ease',
                    transform: expandedCategories.has(category.title) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </div>
                </button>

                {/* Category Items */}
                <div style={{
                  display: 'grid',
                  gap: spacing[2],
                  maxHeight: expandedCategories.has(category.title) ? '1000px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
                  opacity: expandedCategories.has(category.title) ? 1 : 0,
                  paddingLeft: spacing[4]
                }}>
                  {category.items.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      style={{
                        ...createNeumorphicSurface('raised', 'sm', 'md'),
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing[2],
                        padding: `${spacing[2]} ${spacing[3]}`,
                        border: 'none',
                        borderRadius: '8px',
                        background: `linear-gradient(135deg, ${colors.brand.primary}08 0%, ${colors.brand.secondary}08 100%)`,
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        fontFamily: typography.fontFamily.primary,
                        textAlign: 'left',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.boxShadow = shadows.raised.md;
                        e.currentTarget.style.background = `linear-gradient(135deg, ${colors.brand.primary}15 0%, ${colors.brand.secondary}15 100%)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = shadows.raised.sm;
                        e.currentTarget.style.background = `linear-gradient(135deg, ${colors.brand.primary}08 0%, ${colors.brand.secondary}08 100%)`;
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        left: '-12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '2px',
                        height: '60%',
                        backgroundColor: colors.surface.border,
                        borderRadius: '2px'
                      }} />
                      <div style={{
                        fontSize: typography.fontSize.base,
                        width: '24px',
                        textAlign: 'center'
                      }}>
                        {item.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: typography.fontSize.xs,
                          fontWeight: typography.fontWeight.semibold,
                          color: colors.text.primary,
                          marginBottom: '1px'
                        }}>
                          {item.label}
                        </div>
                        <div style={{
                          fontSize: '10px',
                          color: colors.text.tertiary,
                          lineHeight: '1.3'
                        }}>
                          {item.description}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: colors.text.tertiary
                      }}>
                        →
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Dashboard & Logout Section */}
          <div style={{
            marginTop: spacing[8],
            paddingTop: spacing[5],
            borderTop: `2px solid ${colors.surface.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing[3]
          }}>
            <button
              onClick={() => handleNavigate('/manager')}
              style={{
                ...createNeumorphicSurface('raised', 'md', 'lg'),
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: spacing[3],
                padding: `${spacing[4]} ${spacing[5]}`,
                border: 'none',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${colors.brand.primary}11 0%, ${colors.brand.secondary}11 100%)`,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontFamily: typography.fontFamily.primary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = shadows.floating.lg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = shadows.raised.md;
              }}
            >
              <div style={{
                fontSize: typography.fontSize['2xl']
              }}>
                🏠
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.brand.primary
                }}>
                  Dashboard
                </div>
                <div style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary
                }}>
                  Return to main dashboard
                </div>
              </div>
            </button>

            <button
              onClick={handleLogout}
              style={{
                ...createNeumorphicSurface('raised', 'md', 'lg'),
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: spacing[3],
                padding: `${spacing[4]} ${spacing[5]}`,
                border: 'none',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${colors.semantic.error}11 0%, ${colors.semantic.errorLight}11 100%)`,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontFamily: typography.fontFamily.primary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = shadows.floating.lg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = shadows.raised.md;
              }}
            >
              <div style={{
                fontSize: typography.fontSize['2xl']
              }}>
                🚪
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.semantic.error
                }}>
                  Logout
                </div>
                <div style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary
                }}>
                  Sign out of your account
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManagementHubSidebar;
