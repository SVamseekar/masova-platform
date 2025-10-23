import React, { useState, useEffect } from 'react';
import { useCreateOrderMutation } from '../../store/api/orderApi';
import { useGetMenuItemsQuery } from '../../store/api/menuApi';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import type { CreateOrderRequest, OrderType, PaymentMethod, DeliveryAddress } from '../../types/order';

interface OrderFormProps {
  onSuccess?: (orderId: string) => void;
  onCancel?: () => void;
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  customizations?: string[];
}

const OrderForm: React.FC<OrderFormProps> = ({ onSuccess, onCancel }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const storeId = currentUser?.storeId || '';

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    street: '',
    city: '',
    pincode: '',
  });

  // API hooks
  const { data: menuItems = [], isLoading: isLoadingMenu } = useGetMenuItemsQuery({});
  const [createOrder, { isLoading: isCreating, isSuccess, error }] = useCreateOrderMutation();

  // Filter menu items by search
  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.05; // 5% GST
  const deliveryFee = orderType === 'DELIVERY' ? 40 : 0;
  const total = subtotal + tax + deliveryFee;

  // Get quantity for a menu item (0 if not in cart)
  const getItemQuantity = (menuItemId: string): number => {
    const item = cart.find(item => item.menuItemId === menuItemId);
    return item ? item.quantity : 0;
  };

  // Add or increment item in cart
  const addToCart = (menuItem: any) => {
    const existingItem = cart.find(item => item.menuItemId === menuItem.id);

    if (existingItem) {
      setCart(cart.map(item =>
        item.menuItemId === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        variant: menuItem.variants?.[0]?.name,
        customizations: [],
      }]);
    }
  };

  // Decrement item quantity or remove if 0
  const decrementItem = (menuItemId: string) => {
    const existingItem = cart.find(item => item.menuItemId === menuItemId);

    if (existingItem) {
      if (existingItem.quantity === 1) {
        // Remove from cart if quantity would become 0
        setCart(cart.filter(item => item.menuItemId !== menuItemId));
      } else {
        // Decrement quantity
        setCart(cart.map(item =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        ));
      }
    }
  };

  // Remove item from cart
  const removeFromCart = (menuItemId: string) => {
    setCart(cart.filter(item => item.menuItemId !== menuItemId));
  };

  // Update quantity
  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
    } else {
      setCart(cart.map(item =>
        item.menuItemId === menuItemId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('Please enter customer name');
      return;
    }

    if (cart.length === 0) {
      alert('Please add items to the order');
      return;
    }

    if (orderType === 'DELIVERY' && !deliveryAddress.street) {
      alert('Please enter delivery address');
      return;
    }

    const orderData: CreateOrderRequest = {
      storeId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      items: cart.map(item => ({
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        variant: item.variant,
        customizations: item.customizations,
      })),
      orderType,
      paymentMethod,
      deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress : undefined,
      specialInstructions: specialInstructions.trim() || undefined,
    };

    try {
      const result = await createOrder(orderData).unwrap();
      alert(`Order created successfully! Order #${result.orderNumber}`);

      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setCart([]);
      setSpecialInstructions('');
      setDeliveryAddress({ street: '', city: '', pincode: '' });

      if (onSuccess) {
        onSuccess(result.id);
      }
    } catch (err: any) {
      console.error('Failed to create order:', err);
      alert(`Failed to create order: ${err?.data?.error || err.message || 'Unknown error'}`);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      // Handle success
    }
  }, [isSuccess]);

  return (
    <div className="order-form-container" style={{ background: '#f0f0f0', minHeight: '100vh', padding: '24px' }}>
      <style>{`
        .order-form-container {
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .menu-section, .cart-section {
          background: #f0f0f0;
          border-radius: 20px;
          padding: 24px;
          box-shadow:
            12px 12px 24px rgba(163, 163, 163, 0.3),
            -12px -12px 24px rgba(255, 255, 255, 0.8);
        }

        .section-title {
          font-size: 24px;
          font-weight: 700;
          color: #e53e3e;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 12px 16px;
          background: #f0f0f0;
          border: none;
          border-radius: 12px;
          box-shadow:
            inset 4px 4px 8px rgba(163, 163, 163, 0.3),
            inset -4px -4px 8px rgba(255, 255, 255, 0.8);
          font-size: 14px;
          color: #333;
          transition: all 0.2s ease;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          box-shadow:
            inset 6px 6px 12px rgba(163, 163, 163, 0.3),
            inset -6px -6px 12px rgba(255, 255, 255, 0.8);
        }

        .form-textarea {
          min-height: 80px;
          resize: vertical;
        }

        .radio-group {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .radio-option {
          flex: 1;
          min-width: 120px;
        }

        .radio-label {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 16px;
          background: #f0f0f0;
          border-radius: 12px;
          box-shadow:
            6px 6px 12px rgba(163, 163, 163, 0.3),
            -6px -6px 12px rgba(255, 255, 255, 0.8);
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #666;
          transition: all 0.2s ease;
        }

        .radio-input {
          display: none;
        }

        .radio-input:checked + .radio-label {
          color: #e53e3e;
          box-shadow:
            inset 4px 4px 8px rgba(163, 163, 163, 0.3),
            inset -4px -4px 8px rgba(255, 255, 255, 0.8);
        }

        .menu-search {
          margin-bottom: 20px;
        }

        .menu-items {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          max-height: 500px;
          overflow-y: auto;
        }

        .menu-item-card {
          background: #f0f0f0;
          border-radius: 12px;
          padding: 16px;
          box-shadow:
            6px 6px 12px rgba(163, 163, 163, 0.3),
            -6px -6px 12px rgba(255, 255, 255, 0.8);
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .menu-item-card:hover {
          transform: translateY(-2px);
        }

        .menu-item-info {
          flex: 1;
        }

        .menu-item-name {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .menu-item-price {
          font-size: 16px;
          font-weight: 700;
          color: #e53e3e;
        }

        .menu-item-controls {
          display: flex;
          justify-content: center;
        }

        .add-btn {
          width: 100%;
          padding: 8px 16px;
          border: none;
          border-radius: 10px;
          background: #10b981;
          color: white;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow:
            4px 4px 8px rgba(163, 163, 163, 0.3),
            -4px -4px 8px rgba(255, 255, 255, 0.8);
        }

        .add-btn:hover {
          background: #059669;
          transform: translateY(-1px);
        }

        .add-btn:active {
          transform: scale(0.95);
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          justify-content: center;
        }

        .qty-btn-small {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 8px;
          background: #f0f0f0;
          box-shadow:
            4px 4px 8px rgba(163, 163, 163, 0.3),
            -4px -4px 8px rgba(255, 255, 255, 0.8);
          cursor: pointer;
          font-weight: 700;
          font-size: 16px;
          color: #e53e3e;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .qty-btn-small:hover {
          transform: translateY(-1px);
        }

        .qty-btn-small:active {
          box-shadow:
            inset 3px 3px 6px rgba(163, 163, 163, 0.3),
            inset -3px -3px 6px rgba(255, 255, 255, 0.8);
        }

        .qty-display-small {
          min-width: 36px;
          text-align: center;
          font-weight: 700;
          font-size: 16px;
          color: #333;
        }

        .cart-items {
          margin-bottom: 20px;
          max-height: 300px;
          overflow-y: auto;
        }

        .cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f0f0f0;
          border-radius: 12px;
          margin-bottom: 12px;
          box-shadow:
            4px 4px 8px rgba(163, 163, 163, 0.3),
            -4px -4px 8px rgba(255, 255, 255, 0.8);
        }

        .cart-item-info {
          flex: 1;
        }

        .cart-item-name {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .cart-item-price {
          font-size: 12px;
          color: #666;
        }

        .cart-item-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .qty-btn {
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 8px;
          background: #f0f0f0;
          box-shadow:
            4px 4px 8px rgba(163, 163, 163, 0.3),
            -4px -4px 8px rgba(255, 255, 255, 0.8);
          cursor: pointer;
          font-weight: 700;
          color: #e53e3e;
        }

        .qty-btn:active {
          box-shadow:
            inset 3px 3px 6px rgba(163, 163, 163, 0.3),
            inset -3px -3px 6px rgba(255, 255, 255, 0.8);
        }

        .qty-display {
          min-width: 32px;
          text-align: center;
          font-weight: 600;
        }

        .remove-btn {
          padding: 6px 10px;
          border: none;
          border-radius: 8px;
          background: #f0f0f0;
          box-shadow:
            4px 4px 8px rgba(163, 163, 163, 0.3),
            -4px -4px 8px rgba(255, 255, 255, 0.8);
          cursor: pointer;
          color: #ef4444;
          font-size: 12px;
          font-weight: 600;
        }

        .cart-summary {
          background: #f0f0f0;
          border-radius: 12px;
          padding: 16px;
          box-shadow:
            inset 4px 4px 8px rgba(163, 163, 163, 0.2),
            inset -4px -4px 8px rgba(255, 255, 255, 0.8);
          margin-bottom: 20px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .summary-row.total {
          font-size: 18px;
          font-weight: 700;
          color: #e53e3e;
          border-top: 2px solid rgba(163, 163, 163, 0.2);
          padding-top: 12px;
          margin-top: 12px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
        }

        .btn {
          flex: 1;
          padding: 14px 24px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: #e53e3e;
          color: white;
          box-shadow:
            6px 6px 12px rgba(163, 163, 163, 0.3),
            -6px -6px 12px rgba(255, 255, 255, 0.8);
        }

        .btn-primary:hover {
          background: #dc2626;
        }

        .btn-primary:active {
          transform: scale(0.98);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f0f0f0;
          color: #666;
          box-shadow:
            6px 6px 12px rgba(163, 163, 163, 0.3),
            -6px -6px 12px rgba(255, 255, 255, 0.8);
        }

        .btn-secondary:active {
          box-shadow:
            inset 4px 4px 8px rgba(163, 163, 163, 0.3),
            inset -4px -4px 8px rgba(255, 255, 255, 0.8);
        }

        .empty-cart {
          text-align: center;
          padding: 40px 20px;
          color: #999;
          font-style: italic;
        }

        @media (max-width: 1024px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Menu Section */}
          <div className="menu-section">
            <h2 className="section-title">Menu Items</h2>

            <div className="menu-search">
              <input
                type="text"
                className="form-input"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="menu-items">
              {isLoadingMenu ? (
                <div>Loading menu...</div>
              ) : filteredMenuItems.length === 0 ? (
                <div>No menu items found</div>
              ) : (
                filteredMenuItems.map((item) => {
                  const quantity = getItemQuantity(item.id);
                  return (
                    <div key={item.id} className="menu-item-card">
                      <div className="menu-item-info">
                        <div className="menu-item-name">{item.name}</div>
                        <div className="menu-item-price">₹{item.price.toFixed(2)}</div>
                      </div>
                      <div className="menu-item-controls">
                        {quantity === 0 ? (
                          <button
                            type="button"
                            className="add-btn"
                            onClick={() => addToCart(item)}
                          >
                            + Add
                          </button>
                        ) : (
                          <div className="quantity-controls">
                            <button
                              type="button"
                              className="qty-btn-small"
                              onClick={() => decrementItem(item.id)}
                            >
                              −
                            </button>
                            <span className="qty-display-small">{quantity}</span>
                            <button
                              type="button"
                              className="qty-btn-small"
                              onClick={() => addToCart(item)}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Cart & Customer Info Section */}
          <div className="cart-section">
            <h2 className="section-title">Order Details</h2>

            {/* Customer Information */}
            <div className="form-group">
              <label className="form-label">Customer Name *</label>
              <input
                type="text"
                className="form-input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Customer Phone</label>
              <input
                type="tel"
                className="form-input"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="10-digit mobile number"
              />
            </div>

            {/* Order Type */}
            <div className="form-group">
              <label className="form-label">Order Type *</label>
              <div className="radio-group">
                <div className="radio-option">
                  <input
                    type="radio"
                    id="dine-in"
                    name="orderType"
                    value="DINE_IN"
                    checked={orderType === 'DINE_IN'}
                    onChange={(e) => setOrderType(e.target.value as OrderType)}
                    className="radio-input"
                  />
                  <label htmlFor="dine-in" className="radio-label">🍽️ Dine-In</label>
                </div>
                <div className="radio-option">
                  <input
                    type="radio"
                    id="takeaway"
                    name="orderType"
                    value="TAKEAWAY"
                    checked={orderType === 'TAKEAWAY'}
                    onChange={(e) => setOrderType(e.target.value as OrderType)}
                    className="radio-input"
                  />
                  <label htmlFor="takeaway" className="radio-label">🏪 Takeaway</label>
                </div>
                <div className="radio-option">
                  <input
                    type="radio"
                    id="delivery"
                    name="orderType"
                    value="DELIVERY"
                    checked={orderType === 'DELIVERY'}
                    onChange={(e) => setOrderType(e.target.value as OrderType)}
                    className="radio-input"
                  />
                  <label htmlFor="delivery" className="radio-label">=� Delivery</label>
                </div>
              </div>
            </div>

            {/* Delivery Address (shown only for delivery orders) */}
            {orderType === 'DELIVERY' && (
              <>
                <div className="form-group">
                  <label className="form-label">Street Address *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={deliveryAddress.street}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={deliveryAddress.city}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={deliveryAddress.pincode}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, pincode: e.target.value })}
                    required
                  />
                </div>
              </>
            )}

            {/* Payment Method */}
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <div className="radio-group">
                <div className="radio-option">
                  <input
                    type="radio"
                    id="cash"
                    name="paymentMethod"
                    value="CASH"
                    checked={paymentMethod === 'CASH'}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="radio-input"
                  />
                  <label htmlFor="cash" className="radio-label">=� Cash</label>
                </div>
                <div className="radio-option">
                  <input
                    type="radio"
                    id="card"
                    name="paymentMethod"
                    value="CARD"
                    checked={paymentMethod === 'CARD'}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="radio-input"
                  />
                  <label htmlFor="card" className="radio-label">=� Card</label>
                </div>
                <div className="radio-option">
                  <input
                    type="radio"
                    id="upi"
                    name="paymentMethod"
                    value="UPI"
                    checked={paymentMethod === 'UPI'}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="radio-input"
                  />
                  <label htmlFor="upi" className="radio-label">=� UPI</label>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="form-group">
              <label className="form-label">Special Instructions</label>
              <textarea
                className="form-textarea"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any special requests..."
              />
            </div>

            {/* Cart Items */}
            <h3 className="section-title" style={{ fontSize: '18px', marginTop: '24px' }}>Cart</h3>
            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-cart">Cart is empty. Add items from menu.</div>
              ) : (
                cart.map((item) => (
                  <div key={item.menuItemId} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-price">�{item.price.toFixed(2)} each</div>
                    </div>
                    <div className="cart-item-controls">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                      >
                        
                      </button>
                      <span className="qty-display">{item.quantity}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeFromCart(item.menuItemId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Summary */}
            {cart.length > 0 && (
              <div className="cart-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>�{subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax (5%):</span>
                  <span>�{tax.toFixed(2)}</span>
                </div>
                {orderType === 'DELIVERY' && (
                  <div className="summary-row">
                    <span>Delivery Fee:</span>
                    <span>�{deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>�{total.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="form-actions">
              {onCancel && (
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isCreating || cart.length === 0}
              >
                {isCreating ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
