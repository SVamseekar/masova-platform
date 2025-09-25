import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// TypeScript interfaces
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
  toppings?: string[];
  sizes?: { name: string; price: number }[];
}

interface CartItem extends MenuItem {
  quantity: number;
  selectedSize?: string;
  selectedToppings?: string[];
}

interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'preparing' | 'baking' | 'out-for-delivery' | 'delivered';
  estimatedTime: number;
  address: string;
  phone: string;
}

const CustomerApp: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('menu');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  const handleLogout = () => {
    // Clear user session
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const menuItems: MenuItem[] = [
    {
      id: 'pizza-1',
      name: 'Margherita Pizza',
      description: 'Fresh tomatoes, mozzarella, basil',
      price: 299,
      image: '🍕',
      category: 'Pizza',
      available: true,
      sizes: [{ name: 'Regular', price: 299 }, { name: 'Medium', price: 449 }, { name: 'Large', price: 599 }]
    },
    {
      id: 'pizza-2', 
      name: 'Pepperoni Pizza',
      description: 'Pepperoni, mozzarella, tomato sauce',
      price: 399,
      image: '🍕',
      category: 'Pizza',
      available: true,
      sizes: [{ name: 'Regular', price: 399 }, { name: 'Medium', price: 549 }, { name: 'Large', price: 699 }]
    },
    {
      id: 'side-1',
      name: 'Garlic Bread',
      description: 'Crispy bread with garlic and herbs',
      price: 149,
      image: '🥖',
      category: 'Sides',
      available: true
    },
    {
      id: 'drink-1',
      name: 'Coke 600ml',
      description: 'Chilled Coca-Cola',
      price: 60,
      image: '🥤',
      category: 'Beverages',
      available: true
    }
  ];

  const addToCart = (item: MenuItem) => {
    const cartItem: CartItem = {
      ...item,
      quantity: 1,
      selectedSize: item.sizes ? item.sizes[0].name : undefined
    };
    setCart(prev => [...prev, cartItem]);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => {
      const sizePrice = item.selectedSize && item.sizes 
        ? item.sizes.find(s => s.name === item.selectedSize)?.price || item.price
        : item.price;
      return sum + (sizePrice * item.quantity);
    }, 0);
  };

  const placeOrder = () => {
    const order: Order = {
      id: `ORD${Date.now()}`,
      items: cart,
      total: getCartTotal(),
      status: 'preparing',
      estimatedTime: 30,
      address: 'Banjara Hills, Hyderabad',
      phone: '+91 98765 43210'
    };
    setCurrentOrder(order);
    setCart([]);
    setActiveSection('tracking');
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                🍕
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Domino's</h1>
                <p className="text-sm text-gray-600">Hot & Fresh Pizzas</p>
              </div>
            </div>

            {/* Promotional Banners */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
                <p className="font-bold text-sm">🔥 Hot & Fresh Pizzas</p>
                <p className="text-xs">Delivered in 30 minutes or FREE!</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
                <p className="font-bold text-sm">💰 FLAT 40% OFF</p>
                <p className="text-xs">On orders above ₹399</p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCart(!showCart)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg relative"
              >
                🛒 Cart ({cart.length})
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {cart.length}
                  </span>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Promotional Banners */}
        <div className="md:hidden px-4 pb-4 space-y-2">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded-lg text-center">
            <p className="font-bold text-sm">🔥 Hot & Fresh Pizzas - Delivered in 30 minutes or FREE!</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-2 rounded-lg text-center">
            <p className="font-bold text-sm">💰 FLAT 40% OFF on orders above ₹399</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="border-t border-gray-200">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {['menu', 'cart', 'tracking'].map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`py-4 px-2 text-sm font-medium transition-colors border-b-2 ${
                    activeSection === section
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Menu Section */}
        {activeSection === 'menu' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Our Delicious Menu</h2>
              <p className="text-white/80">Handcrafted with love, delivered fresh</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-4xl">{item.image}</div>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-sm font-medium">
                        {item.category}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                    <p className="text-gray-600 mb-4">{item.description}</p>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-red-600">₹{item.price}</span>
                      <button
                        onClick={() => addToCart(item)}
                        disabled={!item.available}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors shadow-lg ${
                          item.available
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {item.available ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cart Section */}
        {activeSection === 'cart' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h2>
              
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🛒</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-600 mb-6">Add some delicious items from our menu</p>
                  <button
                    onClick={() => setActiveSection('menu')}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Browse Menu
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {cart.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{item.image}</div>
                        <div>
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          {item.selectedSize && (
                            <p className="text-sm text-gray-600">Size: {item.selectedSize}</p>
                          )}
                          <span className="text-sm text-gray-500">{item.category}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₹{item.price * item.quantity}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xl font-bold text-gray-900">Total: ₹{getCartTotal()}</span>
                      <span className="text-sm text-green-600 font-medium">
                        {getCartTotal() > 399 ? '40% OFF Applied!' : `Add ₹${399 - getCartTotal()} more for 40% OFF`}
                      </span>
                    </div>
                    
                    <button
                      onClick={placeOrder}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold text-lg transition-colors"
                    >
                      Place Order - ₹{getCartTotal()}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Tracking Section */}
        {activeSection === 'tracking' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Tracking</h2>
              
              {currentOrder ? (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="text-3xl mr-4">✅</div>
                      <div>
                        <h3 className="text-xl font-bold text-green-800">Order Confirmed!</h3>
                        <p className="text-green-700">Order ID: #{currentOrder.id}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Estimated Delivery Time</h4>
                        <p className="text-2xl font-bold text-red-600">{currentOrder.estimatedTime} minutes</p>
                        <p className="text-sm text-gray-600">Your order is being prepared with care</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Delivery Details</h4>
                        <p className="text-sm text-gray-600">📍 Delivering to: {currentOrder.address}</p>
                        <p className="text-sm text-gray-600">📞 Contact: {currentOrder.phone}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Order Status */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Order Status</h4>
                    <div className="flex items-center space-x-4">
                      {['preparing', 'baking', 'out-for-delivery', 'delivered'].map((status, index) => (
                        <div key={status} className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            status === currentOrder.status 
                              ? 'bg-red-600 text-white animate-pulse'
                              : index < ['preparing', 'baking', 'out-for-delivery', 'delivered'].indexOf(currentOrder.status)
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                          {index < 3 && (
                            <div className={`w-16 h-1 ${
                              index < ['preparing', 'baking', 'out-for-delivery', 'delivered'].indexOf(currentOrder.status)
                                ? 'bg-green-600'
                                : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Preparing</span>
                      <span>Baking</span>
                      <span>Out for Delivery</span>
                      <span>Delivered</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No active orders</h3>
                  <p className="text-gray-600 mb-6">Place an order to track its status</p>
                  <button
                    onClick={() => setActiveSection('menu')}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Order Now
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerApp;