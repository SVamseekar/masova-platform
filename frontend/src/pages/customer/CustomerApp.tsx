import React, { useState } from 'react';
import type { MenuItem, CartItem } from '../../services/api/types';

const CustomerApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'menu' | 'cart' | 'checkout' | 'tracking'>('menu');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [orderTracking] = useState({
    status: 'PREPARING',
    estimatedTime: '25 mins',
    progress: 40
  });

  const menuItems: MenuItem[] = [
    { id: 1, name: 'Margherita Pizza', price: 299, category: 'Pizza', image: '🍕', description: 'Fresh tomato, mozzarella, basil' },
    { id: 2, name: 'Pepperoni Pizza', price: 399, category: 'Pizza', image: '🍕', description: 'Pepperoni, cheese, tomato sauce' },
    { id: 3, name: 'Veggie Supreme', price: 449, category: 'Pizza', image: '🍕', description: 'Bell peppers, onions, mushrooms' },
    { id: 4, name: 'Garlic Bread', price: 149, category: 'Sides', image: '🥖', description: 'Fresh baked with garlic butter' },
    { id: 5, name: 'Cheesy Bread', price: 179, category: 'Sides', image: '🧄', description: 'Loaded with mozzarella' },
    { id: 6, name: 'Coke 330ml', price: 49, category: 'Drinks', image: '🥤', description: 'Chilled cola drink' },
    { id: 7, name: 'Sprite 330ml', price: 49, category: 'Drinks', image: '🥤', description: 'Refreshing lemon-lime' }
  ];

  const addToCart = (item: MenuItem) => {
    setCart(prevCart => [
      ...prevCart,
      { ...item, cartId: Date.now() + Math.random(), quantity: 1 }
    ]);
  };

  const removeFromCart = (cartId: number) => {
    setCart(prevCart => prevCart.filter(item => item.cartId !== cartId));
  };

  const getTotalPrice = (): number => {
    return cart.reduce((total: number, item: CartItem) => total + (item.price * item.quantity), 0);
  };

  const getFilteredItems = (): MenuItem[] => {
    return activeFilter === 'All' ? menuItems : menuItems.filter(item => item.category === activeFilter);
  };

  const filters = ['All', 'Pizza', 'Sides', 'Drinks'];

  if (currentView === 'menu') {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#e74c3c', fontSize: '2.5rem', marginBottom: '10px' }}>
            Domino's Menu
          </h1>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>
            Handcrafted with love, delivered fresh
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              style={{
                background: activeFilter === filter ? '#e74c3c' : 'white',
                color: activeFilter === filter ? 'white' : '#333',
                border: '2px solid #e74c3c',
                padding: '12px 24px',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          {getFilteredItems().map(item => (
            <div key={item.id} style={{
              background: 'white',
              borderRadius: '15px',
              padding: '20px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}>
              <div style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '15px' }}>
                {item.image}
              </div>
              <h3 style={{ color: '#333', marginBottom: '10px', fontSize: '1.3rem' }}>
                {item.name}
              </h3>
              <p style={{ color: '#666', marginBottom: '15px', lineHeight: '1.5' }}>
                {item.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#e74c3c' }}>
                  ₹{item.price}
                </span>
                <button
                  onClick={() => addToCart(item)}
                  style={{
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    transition: 'background 0.3s ease'
                  }}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <button
            onClick={() => setCurrentView('cart')}
            style={{
              background: cart.length > 0 ? '#e74c3c' : '#ccc',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '25px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: cart.length > 0 ? 'pointer' : 'not-allowed'
            }}
            disabled={cart.length === 0}
          >
            View Cart ({cart.length})
          </button>
        </div>

        {cart.length > 0 && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: '#e74c3c',
            color: 'white',
            padding: '15px 25px',
            borderRadius: '25px',
            fontSize: '1.1rem',
            fontWeight: '600',
            boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)',
            zIndex: 1000
          }}>
            {cart.length} items • ₹{getTotalPrice()}
          </div>
        )}
      </div>
    );
  }

  if (currentView === 'cart') {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ color: '#333', marginBottom: '20px', fontSize: '2rem' }}>Your Order</h2>
        
        {cart.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '400px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🛒</div>
            <h3 style={{ color: '#666', marginBottom: '10px' }}>Your cart is empty</h3>
            <p style={{ color: '#999' }}>Add some delicious items from our menu</p>
            <button
              onClick={() => setCurrentView('menu')}
              style={{
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '20px',
                fontSize: '1rem',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              Back to Menu
            </button>
          </div>
        ) : (
          <>
            <div style={{ background: 'white', borderRadius: '15px', padding: '20px', marginBottom: '20px' }}>
              {cart.map(item => (
                <div key={item.cartId} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px 0',
                  borderBottom: '1px solid #eee'
                }}>
                  <div>
                    <h4 style={{ color: '#333', marginBottom: '5px' }}>{item.name}</h4>
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>{item.category}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#e74c3c' }}>
                      ₹{item.price}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.cartId)}
                      style={{
                        background: '#ff6b6b',
                        color: 'white',
                        border: 'none',
                        padding: '8px 15px',
                        borderRadius: '15px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '20px',
                fontSize: '1.3rem',
                fontWeight: 'bold'
              }}>
                <span>Total:</span>
                <span style={{ color: '#e74c3c' }}>₹{getTotalPrice()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={() => setCurrentView('menu')}
                style={{
                  background: 'transparent',
                  color: '#e74c3c',
                  border: '2px solid #e74c3c',
                  padding: '15px 30px',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Back to Menu
              </button>
              <button
                onClick={() => setCurrentView('checkout')}
                style={{
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  padding: '15px 30px',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: 2
                }}
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (currentView === 'checkout') {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: '#333', marginBottom: '20px', fontSize: '2rem' }}>Checkout</h2>
        
        <div style={{ background: 'white', borderRadius: '15px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>Order Summary</h3>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: '#e74c3c'
          }}>
            <span>Total Amount:</span>
            <span>₹{getTotalPrice()}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={() => setCurrentView('cart')}
            style={{
              background: 'transparent',
              color: '#e74c3c',
              border: '2px solid #e74c3c',
              padding: '15px 30px',
              borderRadius: '10px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              flex: 1
            }}
          >
            Back to Cart
          </button>
          <button
            onClick={() => setCurrentView('tracking')}
            style={{
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '10px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              flex: 2
            }}
          >
            Place Order - ₹{getTotalPrice()}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ color: '#333', marginBottom: '10px', fontSize: '2rem' }}>Order Tracking</h2>
      <p style={{ color: '#666', marginBottom: '30px', fontSize: '1.1rem' }}>
        Your order is being prepared with care
      </p>

      <div style={{
        background: 'white',
        borderRadius: '15px',
        padding: '30px',
        marginBottom: '20px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '30px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '15px' }}>👨‍🍳</div>
          <h3 style={{ color: '#e74c3c', marginBottom: '10px', fontSize: '1.5rem' }}>
            {orderTracking.status}
          </h3>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>
            Estimated time: {orderTracking.estimatedTime}
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <div style={{
            width: '100%',
            height: '8px',
            background: '#eee',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${orderTracking.progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #e74c3c, #c0392b)',
              borderRadius: '4px',
              transition: 'width 0.5s ease'
            }} />
          </div>
          <p style={{ color: '#666', marginTop: '10px', fontSize: '0.9rem' }}>
            {orderTracking.progress}% Complete
          </p>
        </div>
      </div>

      <button
        onClick={() => setCurrentView('menu')}
        style={{
          background: '#e74c3c',
          color: 'white',
          border: 'none',
          padding: '15px 30px',
          borderRadius: '10px',
          fontSize: '1.1rem',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        Order Again
      </button>
    </div>
  );
};

export default CustomerApp;
