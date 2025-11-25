import React, { useState } from 'react';

// TypeScript interfaces
interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'Pizza' | 'Sides' | 'Drinks';
  image: string;
  description: string;
}

interface CartItem extends MenuItem {
  quantity: number;
  cartId: number;
}

interface OrderTracking {
  status: string;
  estimatedTime: string;
  progress: number;
}

const CustomerApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('menu');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [orderTracking] = useState<OrderTracking>({
    status: 'PREPARING',
    estimatedTime: '25 mins',
    progress: 40
  });

  // Mock menu data
  const menuItems: MenuItem[] = [
    {
      id: '1',
      name: 'Margherita Pizza',
      price: 299,
      category: 'Pizza',
      image: '🍕',
      description: 'Fresh tomato, mozzarella, basil'
    },
    {
      id: '2',
      name: 'Pepperoni Pizza',
      price: 399,
      category: 'Pizza',
      image: '🍕',
      description: 'Pepperoni, cheese, tomato sauce'
    },
    {
      id: '3',
      name: 'Veggie Supreme',
      price: 449,
      category: 'Pizza',
      image: '🍕',
      description: 'Bell peppers, onions, mushrooms'
    },
    {
      id: '4',
      name: 'Garlic Bread',
      price: 149,
      category: 'Sides',
      image: '🥖',
      description: 'Fresh baked with garlic butter'
    },
    {
      id: '5',
      name: 'Cheesy Bread',
      price: 179,
      category: 'Sides',
      image: '🧀',
      description: 'Loaded with mozzarella'
    },
    {
      id: '6',
      name: 'Coke 330ml',
      price: 49,
      category: 'Drinks',
      image: '🥤',
      description: 'Chilled cola drink'
    },
    {
      id: '7',
      name: 'Sprite 330ml',
      price: 49,
      category: 'Drinks',
      image: '🥤',
      description: 'Refreshing lemon-lime'
    }
  ];

  const filters = ['All', 'Pizza', 'Sides', 'Drinks'];

  // Helper functions
  const addToCart = (item: MenuItem): void => {
    setCart(prevCart => [...prevCart, { ...item, quantity: 1, cartId: Date.now() }]);
  };

  const removeFromCart = (cartId: number): void => {
    setCart(prevCart => prevCart.filter(item => item.cartId !== cartId));
  };

  const getTotalPrice = (): number => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getFilteredItems = (): MenuItem[] => {
    return activeFilter === 'All' ? menuItems : menuItems.filter(item => item.category === activeFilter);
  };

  // View Components
  const MenuView: React.FC = () => (
    <div className="menu-container">
      <div className="menu-header">
        <h2 className="section-title">Our Delicious Menu</h2>
        <p className="section-subtitle">Handcrafted with love, delivered fresh</p>
        
        <div className="filter-container">
          {filters.map(filter => (
            <button
              key={filter}
              className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="menu-grid">
        {getFilteredItems().map(item => (
          <div key={item.id} className="menu-item">
            <div className="item-image-container">
              <div className="item-image">{item.image}</div>
              <div className="item-category">{item.category}</div>
            </div>
            <div className="item-content">
              <h3 className="item-name">{item.name}</h3>
              <p className="item-description">{item.description}</p>
              <div className="item-footer">
                <div className="price-container">
                  <span className="currency">₹</span>
                  <span className="price">{item.price}</span>
                </div>
                <button className="add-btn" onClick={() => addToCart(item)}>
                  <span className="add-icon">+</span>
                  Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const CartView: React.FC = () => (
    <div className="cart-container">
      <div className="cart-header">
        <h2 className="section-title">Your Cart</h2>
        <p className="section-subtitle">{cart.length} items selected</p>
      </div>

      {cart.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Add some delicious items from our menu</p>
          <button className="browse-btn" onClick={() => setCurrentView('menu')}>
            Browse Menu
          </button>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.cartId} className="cart-item">
                <div className="cart-item-image">{item.image}</div>
                <div className="cart-item-details">
                  <h4 className="cart-item-name">{item.name}</h4>
                  <p className="cart-item-category">{item.category}</p>
                </div>
                <div className="cart-item-actions">
                  <div className="cart-item-price">₹{item.price}</div>
                  <button className="remove-btn" onClick={() => removeFromCart(item.cartId)}>
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{getTotalPrice()}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Fee</span>
              <span>₹29</span>
            </div>
            <div className="summary-row total-row">
              <span>Total</span>
              <span>₹{getTotalPrice() + 29}</span>
            </div>
            <button className="checkout-btn" onClick={() => setCurrentView('payment')}>
              <span>Proceed to Payment</span>
              <span className="btn-icon">→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const PaymentView: React.FC = () => (
    <div className="payment-container">
      <div className="payment-header">
        <h2 className="section-title">Secure Payment</h2>
        <p className="section-subtitle">Choose your preferred payment method</p>
      </div>

      <div className="payment-methods">
        <div className="payment-option selected">
          <div className="payment-icon">💳</div>
          <div className="payment-details">
            <h4>Razorpay</h4>
            <p>Cards, UPI, Wallets & More</p>
          </div>
          <div className="payment-radio">
            <input type="radio" name="payment" defaultChecked />
          </div>
        </div>
        
        <div className="payment-option">
          <div className="payment-icon">💵</div>
          <div className="payment-details">
            <h4>Cash on Delivery</h4>
            <p>Pay when you receive</p>
          </div>
          <div className="payment-radio">
            <input type="radio" name="payment" />
          </div>
        </div>
      </div>

      <div className="order-summary-card">
        <h3 className="summary-title">Order Summary</h3>
        <div className="summary-details">
          <div className="summary-line">
            <span>Items ({cart.length})</span>
            <span>₹{getTotalPrice()}</span>
          </div>
          <div className="summary-line">
            <span>Delivery Charges</span>
            <span>₹29</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-line total">
            <span>Total Amount</span>
            <span>₹{getTotalPrice() + 29}</span>
          </div>
        </div>
      </div>

      <button className="pay-btn" onClick={() => setCurrentView('tracking')}>
        <span>Pay ₹{getTotalPrice() + 29}</span>
        <span className="btn-icon">→</span>
      </button>
    </div>
  );

  const TrackingView: React.FC = () => (
    <div className="tracking-container">
      <div className="tracking-header">
        <h2 className="section-title">Order Tracking</h2>
        <p className="section-subtitle">Your order is being prepared with care</p>
      </div>

      <div className="order-info-card">
        <div className="order-number">Order #1245</div>
        <div className="estimated-time">{orderTracking.estimatedTime} remaining</div>
      </div>

      <div className="progress-container">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${orderTracking.progress}%` }}></div>
        </div>

        <div className="status-timeline">
          <div className="status-item completed">
            <div className="status-icon">✓</div>
            <div className="status-details">
              <div className="status-title">Order Confirmed</div>
              <div className="status-time">2 mins ago</div>
            </div>
          </div>
          
          <div className="status-item active">
            <div className="status-icon">👨‍🍳</div>
            <div className="status-details">
              <div className="status-title">Preparing Your Food</div>
              <div className="status-time">In progress</div>
            </div>
          </div>
          
          <div className="status-item">
            <div className="status-icon">🔥</div>
            <div className="status-details">
              <div className="status-title">In the Oven</div>
              <div className="status-time">Next</div>
            </div>
          </div>
          
          <div className="status-item">
            <div className="status-icon">🚚</div>
            <div className="status-details">
              <div className="status-title">Out for Delivery</div>
              <div className="status-time">Upcoming</div>
            </div>
          </div>
        </div>
      </div>

      <div className="delivery-info">
        <div className="delivery-card">
          <h4>Delivery Details</h4>
          <p>📍 Delivering to: Banjara Hills, Hyderabad</p>
          <p>📞 Contact: +91 98765 43210</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="customer-app" style={{
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
      WebkitTapHighlightColor: 'transparent'
    }}>
      <style>{`
        .customer-app {
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #f0f0f0;
          min-height: 100vh;
          padding: 0;
        }

        /* Navigation Header */
        .nav-header {
          background: #f0f0f0;
          padding: 20px;
          box-shadow: 
            inset 8px 8px 16px rgba(163, 163, 163, 0.2),
            inset -8px -8px 16px rgba(255, 255, 255, 0.8);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
        }

        .logo {
          font-size: 24px;
          font-weight: 800;
          color: #e53e3e;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-buttons {
          display: flex;
          gap: 12px;
        }

        .nav-btn {
          background: #f0f0f0;
          border: none;
          color: #666;
          padding: 12px 16px;
          border-radius: 16px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
          position: relative;
          box-shadow: 
            6px 6px 12px rgba(163, 163, 163, 0.3),
            -6px -6px 12px rgba(255, 255, 255, 0.8);
          min-width: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .nav-btn:active {
          transform: scale(0.95);
          box-shadow: 
            inset 4px 4px 8px rgba(163, 163, 163, 0.3),
            inset -4px -4px 8px rgba(255, 255, 255, 0.8);
        }

        .nav-btn.active {
          color: #e53e3e;
          box-shadow: 
            inset 4px 4px 8px rgba(163, 163, 163, 0.3),
            inset -4px -4px 8px rgba(255, 255, 255, 0.8);
        }

        .cart-badge {
          background: #e53e3e;
          color: white;
          border-radius: 50%;
          padding: 2px 6px;
          font-size: 11px;
          font-weight: 700;
          margin-left: 4px;
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Main Content */
        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .section-title {
          font-size: 28px;
          font-weight: 700;
          color: #333;
          margin-bottom: 8px;
          text-align: center;
        }

        .section-subtitle {
          color: #666;
          text-align: center;
          margin-bottom: 30px;
          font-size: 16px;
        }

        /* Menu Styles */
        .menu-container {
          animation: slideIn 0.4s ease;
        }

        .filter-container {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .filter-btn {
          background: #f0f0f0;
          border: none;
          padding: 12px 24px;
          border-radius: 20px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #666;
          box-shadow: 
            6px 6px 12px rgba(163, 163, 163, 0.3),
            -6px -6px 12px rgba(255, 255, 255, 0.8);
          min-width: 80px;
        }

        .filter-btn:active {
          transform: scale(0.95);
        }

        .filter-btn.active {
          color: #e53e3e;
          box-shadow: 
            inset 4px 4px 8px rgba(163, 163, 163, 0.3),
            inset -4px -4px 8px rgba(255, 255, 255, 0.8);
        }

        .menu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .menu-item {
          background: #f0f0f0;
          border-radius: 20px;
          padding: 20px;
          transition: all 0.3s ease;
          box-shadow: 
            12px 12px 24px rgba(163, 163, 163, 0.3),
            -12px -12px 24px rgba(255, 255, 255, 0.8);
        }

        .menu-item:hover {
          transform: translateY(-2px);
        }

        .item-image-container {
          position: relative;
          text-align: center;
          margin-bottom: 16px;
        }

        .item-image {
          font-size: 60px;
          margin-bottom: 8px;
        }

        .item-category {
          background: #e53e3e;
          color: white;
          font-size: 11px;
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .item-content {
          text-align: center;
        }

        .item-name {
          font-size: 20px;
          font-weight: 700;
          color: #333;
          margin-bottom: 8px;
        }

        .item-description {
          color: #666;
          font-size: 14px;
          margin-bottom: 16px;
          line-height: 1.4;
        }

        .item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .price-container {
          display: flex;
          align-items: baseline;
          gap: 2px;
        }

        .currency {
          color: #e53e3e;
          font-size: 16px;
          font-weight: 600;
        }

        .price {
          color: #e53e3e;
          font-size: 22px;
          font-weight: 700;
        }

        .add-btn {
          background: #f0f0f0;
          border: none;
          padding: 12px 20px;
          border-radius: 16px;
          cursor: pointer;
          font-weight: 600;
          color: #e53e3e;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 
            6px 6px 12px rgba(163, 163, 163, 0.3),
            -6px -6px 12px rgba(255, 255, 255, 0.8);
        }

        .add-btn:active {
          transform: scale(0.95);
          box-shadow: 
            inset 4px 4px 8px rgba(163, 163, 163, 0.3),
            inset -4px -4px 8px rgba(255, 255, 255, 0.8);
        }

        .add-icon {
          font-size: 18px;
          font-weight: 700;
        }

        /* Cart Styles */
        .cart-container {
          animation: slideIn 0.4s ease;
        }

        .empty-cart {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          font-size: 80px;
          margin-bottom: 20px;
        }

        .empty-cart h3 {
          color: #333;
          margin-bottom: 8px;
          font-size: 22px;
        }

        .empty-cart p {
          color: #666;
          margin-bottom: 30px;
        }

        .browse-btn {
          background: #f0f0f0;
          border: none;
          padding: 16px 32px;
          border-radius: 20px;
          font-weight: 600;
          color: #e53e3e;
          cursor: pointer;
          box-shadow: 
            8px 8px 16px rgba(163, 163, 163, 0.3),
            -8px -8px 16px rgba(255, 255, 255, 0.8);
          transition: all 0.2s ease;
          font-size: 16px;
        }

        .browse-btn:active {
          transform: scale(0.95);
          box-shadow: 
            inset 6px 6px 12px rgba(163, 163, 163, 0.3),
            inset -6px -6px 12px rgba(255, 255, 255, 0.8);
        }

        .cart-items {
          margin-bottom: 30px;
        }

        .cart-item {
          background: #f0f0f0;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 
            8px 8px 16px rgba(163, 163, 163, 0.3),
            -8px -8px 16px rgba(255, 255, 255, 0.8);
        }

        .cart-item-image {
          font-size: 32px;
        }

        .cart-item-details {
          flex: 1;
        }

        .cart-item-name {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }

        .cart-item-category {
          font-size: 12px;
          color: #666;
        }

        .cart-item-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cart-item-price {
          font-size: 16px;
          font-weight: 700;
          color: #e53e3e;
        }

        .remove-btn {
          background: #f0f0f0;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 20px;
          color: #999;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 
            6px 6px 12px rgba(163, 163, 163, 0.3),
            -6px -6px 12px rgba(255, 255, 255, 0.8);
          transition: all 0.2s ease;
        }

        .remove-btn:active {
          transform: scale(0.95);
          box-shadow: 
            inset 4px 4px 8px rgba(163, 163, 163, 0.3),
            inset -4px -4px 8px rgba(255, 255, 255, 0.8);
        }

        .cart-summary {
          background: #f0f0f0;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 
            12px 12px 24px rgba(163, 163, 163, 0.3),
            -12px -12px 24px rgba(255, 255, 255, 0.8);
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 16px;
        }

        .total-row {
          border-top: 1px solid rgba(163, 163, 163, 0.2);
          padding-top: 12px;
          font-weight: 700;
          color: #e53e3e;
          font-size: 18px;
        }

        .checkout-btn {
          width: 100%;
          background: #f0f0f0;
          border: none;
          padding: 18px;
          border-radius: 16px;
          font-weight: 700;
          color: #e53e3e;
          cursor: pointer;
          margin-top: 20px;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 
            8px 8px 16px rgba(163, 163, 163, 0.3),
            -8px -8px 16px rgba(255, 255, 255, 0.8);
          transition: all 0.2s ease;
        }

        .checkout-btn:active {
          transform: scale(0.98);
          box-shadow: 
            inset 6px 6px 12px rgba(163, 163, 163, 0.3),
            inset -6px -6px 12px rgba(255, 255, 255, 0.8);
        }

        /* Payment Styles */
        .payment-container {
          animation: slideIn 0.4s ease;
        }

        .payment-methods {
          margin-bottom: 30px;
        }

        .payment-option {
          background: #f0f0f0;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 
            8px 8px 16px rgba(163, 163, 163, 0.3),
            -8px -8px 16px rgba(255, 255, 255, 0.8);
        }

        .payment-option.selected {
          box-shadow: 
            inset 6px 6px 12px rgba(163, 163, 163, 0.3),
            inset -6px -6px 12px rgba(255, 255, 255, 0.8);
        }

        .payment-icon {
          font-size: 28px;
        }

        .payment-details {
          flex: 1;
        }

        .payment-details h4 {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }

        .payment-details p {
          font-size: 14px;
          color: #666;
        }

        .payment-radio {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 
            inset 4px 4px 8px rgba(163, 163, 163, 0.3),
            inset -4px -4px 8px rgba(255, 255, 255, 0.8);
        }

        .payment-radio input {
          display: none;
        }

        .order-summary-card {
          background: #f0f0f0;
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 30px;
          box-shadow: 
            12px 12px 24px rgba(163, 163, 163, 0.3),
            -12px -12px 24px rgba(255, 255, 255, 0.8);
        }

        .summary-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 16px;
        }

        .summary-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 16px;
        }

        .summary-divider {
          height: 1px;
          background: rgba(163, 163, 163, 0.2);
          margin: 16px 0;
        }

        .summary-line.total {
          font-weight: 700;
          color: #e53e3e;
          font-size: 18px;
        }

        .pay-btn {
          width: 100%;
          background: #f0f0f0;
          border: none;
          padding: 20px;
          border-radius: 16px;
          font-weight: 700;
          color: #e53e3e;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 
            8px 8px 16px rgba(163, 163, 163, 0.3),
            -8px -8px 16px rgba(255, 255, 255, 0.8);
          transition: all 0.2s ease;
        }

        .pay-btn:active {
          transform: scale(0.98);
          box-shadow: 
            inset 6px 6px 12px rgba(163, 163, 163, 0.3),
            inset -6px -6px 12px rgba(255, 255, 255, 0.8);
        }

        /* Tracking Styles */
        .tracking-container {
          animation: slideIn 0.4s ease;
        }

        .order-info-card {
          background: #f0f0f0;
          border-radius: 20px;
          padding: 24px;
          text-align: center;
          margin-bottom: 30px;
          box-shadow: 
            12px 12px 24px rgba(163, 163, 163, 0.3),
            -12px -12px 24px rgba(255, 255, 255, 0.8);
        }

        .order-number {
          font-size: 24px;
          font-weight: 700;
          color: #e53e3e;
          margin-bottom: 8px;
        }

        .estimated-time {
          font-size: 16px;
          color: #666;
        }

        .progress-container {
          background: #f0f0f0;
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 30px;
          box-shadow: 
            12px 12px 24px rgba(163, 163, 163, 0.3),
            -12px -12px 24px rgba(255, 255, 255, 0.8);
        }

        .progress-bar {
          height: 8px;
          background: #f0f0f0;
          border-radius: 4px;
          margin-bottom: 30px;
          box-shadow: 
            inset 4px 4px 8px rgba(163, 163, 163, 0.3),
            inset -4px -4px 8px rgba(255, 255, 255, 0.8);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #e53e3e, #ff6b6b);
          border-radius: 4px;
          transition: width 0.3s ease;
          box-shadow: 0 2px 4px rgba(229, 62, 62, 0.3);
        }

        .status-timeline {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .status-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          box-shadow: 
            6px 6px 12px rgba(163, 163, 163, 0.3),
            -6px -6px 12px rgba(255, 255, 255, 0.8);
        }

        .status-item.completed .status-icon {
          background: #4ade80;
          color: white;
          box-shadow: 0 4px 8px rgba(74, 222, 128, 0.3);
        }

        .status-item.active .status-icon {
          background: #e53e3e;
          color: white;
          box-shadow: 0 4px 8px rgba(229, 62, 62, 0.3);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .status-details {
          flex: 1;
        }

        .status-title {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }

        .status-time {
          font-size: 14px;
          color: #666;
        }

        .delivery-info {
          animation: slideIn 0.6s ease;
        }

        .delivery-card {
          background: #f0f0f0;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 
            12px 12px 24px rgba(163, 163, 163, 0.3),
            -12px -12px 24px rgba(255, 255, 255, 0.8);
        }

        .delivery-card h4 {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 16px;
        }

        .delivery-card p {
          font-size: 15px;
          color: #666;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Animations */
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .btn-icon {
          font-size: 16px;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .main-content {
            padding: 15px;
          }
          
          .nav-header {
            padding: 15px;
          }
          
          .nav-buttons {
            flex-wrap: wrap;
            gap: 8px;
          }
          
          .nav-btn {
            padding: 10px 12px;
            font-size: 13px;
            min-width: 70px;
          }
          
          .menu-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
          }
          
          .menu-item {
            padding: 16px;
          }
          
          .item-image {
            font-size: 48px;
          }
          
          .section-title {
            font-size: 24px;
          }
          
          .filter-container {
            gap: 8px;
          }
          
          .filter-btn {
            padding: 10px 16px;
            font-size: 14px;
          }
          
          .status-timeline {
            gap: 16px;
          }
          
          .status-icon {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }
        }

        @media (max-width: 480px) {
          .nav-content {
            flex-direction: column;
            gap: 15px;
          }
          
          .menu-grid {
            grid-template-columns: 1fr;
          }
          
          .item-footer {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
          
          .add-btn {
            width: 100%;
            justify-content: center;
          }
          
          .cart-item {
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }
          
          .cart-item-actions {
            justify-content: center;
          }
        }
      `}</style>

      {/* Navigation Header */}
      <header className="nav-header">
        <div className="nav-content">
          <div className="logo">🍕 MaSoVa</div>
          <div className="nav-buttons">
            <button 
              className={`nav-btn ${currentView === 'menu' ? 'active' : ''}`}
              onClick={() => setCurrentView('menu')}
            >
              Menu
            </button>
            <button 
              className={`nav-btn ${currentView === 'cart' ? 'active' : ''}`}
              onClick={() => setCurrentView('cart')}
            >
              Cart
              {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
            </button>
            <button 
              className={`nav-btn ${currentView === 'payment' ? 'active' : ''}`}
              onClick={() => setCurrentView('payment')}
            >
              Payment
            </button>
            <button 
              className={`nav-btn ${currentView === 'tracking' ? 'active' : ''}`}
              onClick={() => setCurrentView('tracking')}
            >
              Track
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {currentView === 'menu' && <MenuView />}
        {currentView === 'cart' && <CartView />}
        {currentView === 'payment' && <PaymentView />}
        {currentView === 'tracking' && <TrackingView />}
      </main>
    </div>
  );
};

export default CustomerApp;
