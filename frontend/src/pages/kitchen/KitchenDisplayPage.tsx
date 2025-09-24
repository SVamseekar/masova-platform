import React, { useState, useEffect } from 'react';

interface OrderItem {
  name: string;
  size: string | null;
  toppings: string[];
}

interface Order {
  id: string;
  orderNumber: number;
  status: string;
  items: OrderItem[];
  receivedAt: Date;
  estimatedPrepTime: number;
  customer: string;
  orderType: string;
  priority: string;
  ovenStartTime?: Date;
  ovenEndTime?: Date;
}

const KitchenDisplayPage: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [orders] = useState<Order[]>([
    {
      id: 'ORD001',
      orderNumber: 1245,
      status: 'PREPARING',
      items: [
        { name: 'Margherita Pizza', size: 'Large', toppings: ['Extra Cheese'] },
        { name: 'Garlic Bread', size: null, toppings: [] }
      ],
      receivedAt: new Date(Date.now() - 8 * 60000),
      estimatedPrepTime: 15,
      customer: 'John Doe',
      orderType: 'DELIVERY',
      priority: 'normal'
    },
    {
      id: 'ORD002',
      orderNumber: 1246,
      status: 'OVEN',
      items: [
        { name: 'Pepperoni Pizza', size: 'Medium', toppings: ['Pepperoni', 'Mushrooms'] }
      ],
      receivedAt: new Date(Date.now() - 12 * 60000),
      estimatedPrepTime: 18,
      ovenStartTime: new Date(Date.now() - 3 * 60000),
      customer: 'Sarah Wilson',
      orderType: 'COLLECTION',
      priority: 'urgent'
    },
    {
      id: 'ORD003',
      orderNumber: 1247,
      status: 'BAKED',
      items: [
        { name: 'Veggie Supreme', size: 'Large', toppings: ['Bell Peppers', 'Onions', 'Olives'] },
        { name: 'Coke 330ml', size: null, toppings: [] }
      ],
      receivedAt: new Date(Date.now() - 20 * 60000),
      estimatedPrepTime: 20,
      ovenStartTime: new Date(Date.now() - 8 * 60000),
      ovenEndTime: new Date(Date.now() - 1 * 60000),
      customer: 'Mike Johnson',
      orderType: 'DELIVERY',
      priority: 'normal'
    }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeElapsed = (startTime: Date): number => {
    return Math.floor((currentTime.getTime() - startTime.getTime()) / 60000);
  };

  const statusColumns = [
    { status: 'PREPARING', title: 'Preparing', icon: '👨‍🍳' },
    { status: 'OVEN', title: 'In Oven', icon: '🔥' },
    { status: 'BAKED', title: 'Ready', icon: '✅' }
  ];

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: '#f5f6fa', 
      minHeight: '100vh'
    }}>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        background: 'white',
        padding: '20px',
        borderRadius: '15px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          color: '#e74c3c', 
          fontSize: '2.5rem', 
          margin: '0 0 10px 0',
          fontWeight: 'bold'
        }}>
          Kitchen Display System
        </h1>
        <div style={{ 
          fontSize: '1.2rem', 
          color: '#666',
          marginBottom: '10px'
        }}>
          {currentTime.toLocaleTimeString('en-IN')} | Active Orders: {orders.length}
        </div>
      </div>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '20px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {statusColumns.map(column => (
          <div key={column.status} style={{
            background: 'white',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            minHeight: '600px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
              padding: '15px',
              background: '#f8f9fa',
              borderRadius: '10px'
            }}>
              <span style={{ fontSize: '2rem', marginRight: '12px' }}>
                {column.icon}
              </span>
              <div>
                <h2 style={{ 
                  margin: 0, 
                  color: '#333',
                  fontSize: '1.4rem'
                }}>
                  {column.title}
                </h2>
                <div style={{ 
                  color: '#666',
                  fontSize: '0.9rem',
                  marginTop: '4px'
                }}>
                  {getOrdersByStatus(column.status).length} orders
                </div>
              </div>
            </div>

            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {getOrdersByStatus(column.status).length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#999',
                  fontSize: '1rem'
                }}>
                  No orders in {column.title.toLowerCase()}
                </div>
              ) : (
                getOrdersByStatus(column.status).map(order => (
                  <div key={order.id} style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '12px',
                    border: `3px solid ${order.priority === 'urgent' ? '#e74c3c' : '#27ae60'}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: '12px' 
                    }}>
                      <div>
                        <h3 style={{ 
                          margin: '0 0 4px 0', 
                          fontSize: '1.2rem', 
                          color: '#333',
                          fontWeight: 'bold'
                        }}>
                          #{order.orderNumber}
                        </h3>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                          {order.customer} • {order.orderType}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {order.priority === 'urgent' && (
                          <div style={{
                            background: '#e74c3c',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            marginBottom: '4px'
                          }}>
                            URGENT
                          </div>
                        )}
                        <div style={{ 
                          fontSize: '0.9rem', 
                          color: '#666'
                        }}>
                          {getTimeElapsed(order.receivedAt)}min elapsed
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      {order.items.map((item: OrderItem, index: number) => (
                        <div key={index} style={{ 
                          padding: '8px 12px',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          marginBottom: '6px'
                        }}>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#333' }}>
                            {item.size ? `${item.name} (${item.size})` : item.name}
                          </div>
                          {item.toppings.length > 0 && (
                            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                              Toppings: {item.toppings.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div style={{
                      background: '#e74c3c',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '15px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      display: 'inline-block'
                    }}>
                      {order.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KitchenDisplayPage;
