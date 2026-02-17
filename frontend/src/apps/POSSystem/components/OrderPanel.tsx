// src/apps/POSSystem/components/OrderPanel.tsx
import React from 'react';
import { CURRENCY } from '../../../config/business-config';
import Card from '../../../components/ui/neumorphic/Card';
import Badge from '../../../components/ui/neumorphic/Badge';
import Button from '../../../components/ui/neumorphic/Button';
import { colors, shadows, spacing, typography } from '../../../styles/design-tokens';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';

interface OrderPanelProps {
  items: any[];
  onUpdateQuantity: (menuItemId: string, quantity: number) => void;
  onRemoveItem: (menuItemId: string) => void;
  onUpdateInstructions: (menuItemId: string, instructions: string) => void;
  onNewOrder: () => void;
  orderType: 'PICKUP' | 'DELIVERY'; // Removed DINE_IN
  onOrderTypeChange: (type: 'PICKUP' | 'DELIVERY') => void;
  selectedTable?: string | null;
  onTableSelect: (table: string | null) => void;
}

const OrderPanel: React.FC<OrderPanelProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateInstructions,
  onNewOrder,
  orderType,
  onOrderTypeChange,
  selectedTable,
  onTableSelect,
}) => {
  // Calculate totals - matching customer side logic
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.05; // 5% tax
  const deliveryFee = orderType === 'DELIVERY' && subtotal > 0 ? 40 : 0;
  const total = subtotal + tax + deliveryFee;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: spacing[3],
        borderBottom: `2px solid ${colors.surface.border}`,
        background: `linear-gradient(135deg, ${colors.surface.background} 0%, ${colors.surface.secondary} 100%)`
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing[3]
        }}>
          <h3 style={{
            margin: 0,
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2]
          }}>
            <ShoppingCartIcon style={{ fontSize: '20px', color: colors.brand.primary }} />
            Current Order
          </h3>
          {items.length > 0 && (
            <Button
              size="sm"
              variant="danger"
              onClick={onNewOrder}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Order Type Selection */}
        <div style={{
          display: 'flex',
          gap: spacing[2],
          marginBottom: spacing[3]
        }}>
          {[
            { value: 'PICKUP', label: 'Pickup', Icon: ShoppingBagIcon },
            { value: 'DELIVERY', label: 'Delivery', Icon: LocalShippingIcon }
          ].map(type => (
            <button
              key={type.value}
              onClick={() => onOrderTypeChange(type.value as any)}
              style={{
                flex: 1,
                padding: `${spacing[3]} ${spacing[2]}`,
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
                fontFamily: typography.fontFamily.primary,
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: spacing[1],
                ...(orderType === type.value ? {
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
                if (orderType !== type.value) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = shadows.floating.sm;
                }
              }}
              onMouseLeave={(e) => {
                if (orderType !== type.value) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = shadows.raised.sm;
                }
              }}
            >
              <type.Icon style={{ fontSize: '18px' }} />
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Order Items List */}
      <div style={{ flex: 1, overflow: 'auto', padding: spacing[4] }}>
        {items.length === 0 ? (
          <Card
            elevation="sm"
            padding="lg"
            style={{
              background: `linear-gradient(135deg, ${colors.semantic.infoLight}22 0%, ${colors.semantic.info}11 100%)`,
              border: `2px solid ${colors.semantic.info}`,
              color: colors.text.primary,
              textAlign: 'center',
              marginTop: spacing[6]
            }}
          >
            No items in order. Select items from the menu to get started.
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
            {items.map((item, index) => (
              <Card
                key={item.menuItemId}
                elevation="md"
                padding="base"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing[3]
                }}
              >
                {/* Item Name and Price */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.text.primary,
                      marginBottom: spacing[1]
                    }}>
                      {item.name}
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text.secondary
                    }}>
                      {CURRENCY.format(item.price)} each
                    </div>
                  </div>
                  <div style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.brand.primary
                  }}>
                    {CURRENCY.format(item.price * item.quantity)}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                    <button
                      onClick={() => onUpdateQuantity(item.menuItemId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        border: 'none',
                        background: item.quantity <= 1 ? colors.surface.secondary : colors.surface.primary,
                        color: item.quantity <= 1 ? colors.text.tertiary : colors.text.primary,
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.bold,
                        cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: item.quantity <= 1 ? 'none' : shadows.raised.sm,
                        transition: 'all 0.2s ease',
                        opacity: item.quantity <= 1 ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (item.quantity > 1) {
                          e.currentTarget.style.boxShadow = shadows.inset.sm;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (item.quantity > 1) {
                          e.currentTarget.style.boxShadow = shadows.raised.sm;
                        }
                      }}
                    >
                      −
                    </button>
                    <Badge variant="secondary" size="sm" style={{ minWidth: '40px', textAlign: 'center' }}>
                      {item.quantity}
                    </Badge>
                    <button
                      onClick={() => onUpdateQuantity(item.menuItemId, item.quantity + 1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        border: 'none',
                        background: colors.surface.primary,
                        color: colors.text.primary,
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.bold,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: shadows.raised.sm,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = shadows.inset.sm;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = shadows.raised.sm;
                      }}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.menuItemId)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      border: 'none',
                      background: colors.semantic.error,
                      color: colors.text.inverse,
                      fontSize: typography.fontSize.base,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: shadows.raised.sm,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = shadows.floating.md;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = shadows.raised.sm;
                    }}
                  >
                    <DeleteOutlineIcon style={{ fontSize: '16px' }} />
                  </button>
                </div>

                {/* Special Instructions */}
                <textarea
                  placeholder="Special instructions (optional)"
                  value={item.specialInstructions || ''}
                  onChange={(e) => onUpdateInstructions(item.menuItemId, e.target.value)}
                  rows={1}
                  style={{
                    width: '100%',
                    padding: spacing[2],
                    border: `2px solid ${colors.surface.border}`,
                    borderRadius: '8px',
                    outline: 'none',
                    backgroundColor: colors.surface.primary,
                    fontSize: typography.fontSize.xs,
                    color: colors.text.primary,
                    fontFamily: typography.fontFamily.primary,
                    boxShadow: shadows.inset.sm,
                    resize: 'vertical',
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
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Order Summary */}
      {items.length > 0 && (
        <div style={{
          padding: spacing[3],
          borderTop: `2px solid ${colors.surface.border}`,
          backgroundColor: colors.surface.secondary
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: spacing[1],
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary
          }}>
            <span>Subtotal:</span>
            <span style={{ fontWeight: typography.fontWeight.semibold }}>{CURRENCY.format(subtotal)}</span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: spacing[1],
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary
          }}>
            <span>Tax (5%):</span>
            <span style={{ fontWeight: typography.fontWeight.semibold }}>{CURRENCY.format(tax)}</span>
          </div>

          {orderType === 'DELIVERY' && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: spacing[1],
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary
            }}>
              <span>Delivery Fee:</span>
              <span style={{ fontWeight: typography.fontWeight.semibold }}>
                {deliveryFee === 0 ? 'FREE' : CURRENCY.format(deliveryFee)}
              </span>
            </div>
          )}

          <div style={{
            height: '1px',
            background: colors.surface.border,
            margin: `${spacing[2]} 0`
          }} />

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: spacing[2]
          }}>
            <span style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.extrabold,
              color: colors.text.primary
            }}>
              Total:
            </span>
            <span style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.extrabold,
              color: colors.brand.primary
            }}>
              {CURRENCY.format(total)}
            </span>
          </div>

          {/* Item Count */}
          <div style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary,
            textAlign: 'center',
            fontWeight: typography.fontWeight.medium
          }}>
            <InventoryIcon style={{ fontSize: '14px', marginRight: '4px' }} />
            {items.length} item{items.length !== 1 ? 's' : ''} • {items.reduce((sum, item) => sum + item.quantity, 0)} qty
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPanel;
