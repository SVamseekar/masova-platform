import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTrackOrderQuery, OrderItem } from '../../store/api/orderApi';
import { useTrackOrderQuery as useDeliveryTrackQuery } from '../../store/api/deliveryApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearCart } from '../../store/slices/cartSlice';
import CustomerPageHeader from '../../components/common/CustomerPageHeader';
import { DriverTrackingMap } from '../../components/delivery/DriverTrackingMap';
import { useOrderTrackingWebSocket } from '../../hooks/useOrderTrackingWebSocket';
import { OrderTrackingUpdate } from '../../services/websocketService';

// ─── Types ────────────────────────────────────────────────────────────────────
type OrderStatus = 'RECEIVED' | 'PREPARING' | 'OVEN' | 'BAKED' | 'READY' | 'DISPATCHED' | 'DELIVERED' | 'COMPLETED';

const ORDER_STEPS: { status: OrderStatus; label: string; description: string }[] = [
  { status: 'RECEIVED',   label: 'Order Placed',    description: 'Restaurant received your order' },
  { status: 'PREPARING',  label: 'Preparing',       description: 'Kitchen is getting started'     },
  { status: 'OVEN',       label: 'In the Oven',     description: 'Your food is cooking'           },
  { status: 'BAKED',      label: 'Baked',           description: 'Fresh out of the oven'          },
  { status: 'READY',      label: 'Ready',           description: 'Packed and ready to go'         },
  { status: 'DISPATCHED', label: 'Out for Delivery', description: 'Driver is on the way'          },
  { status: 'DELIVERED',  label: 'Delivered',       description: 'Enjoy your meal!'               },
];

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
const IconCheck = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconTruck = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 3v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const IconPhone = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.12 1.22 2 2 0 012.1 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-.45a2 2 0 012.11.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);

const IconStar = ({ size = 14, filled = false, color = 'var(--gold)' }: { size?: number; filled?: boolean; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconClock = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

// ─── Sub-components ───────────────────────────────────────────────────────────
const OrderMeta: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
    <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: '0.82rem', color: 'var(--text-2)', textAlign: 'right', fontWeight: 500 }}>{value}</span>
  </div>
);

// ─── Rating Dialog ────────────────────────────────────────────────────────────
const RatingDialog: React.FC<{
  open: boolean;
  driverName?: string;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}> = ({ open, driverName, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 420, textAlign: 'center' }}
      >
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <IconTruck size={22} color="var(--gold)" />
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Rate your delivery</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: 24 }}>{driverName ? `How was ${driverName}'s service?` : 'How was your delivery?'}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setRating(n)} onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, transition: 'transform 0.1s', transform: (hovered || rating) >= n ? 'scale(1.2)' : 'scale(1)' }}>
              <IconStar size={28} filled={(hovered || rating) >= n} />
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Any comments? (optional)"
          rows={3}
          style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: '0.85rem', color: 'var(--text-1)', fontFamily: 'var(--font-body)', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 20 }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)', borderRadius: 'var(--radius-pill)', padding: '11px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>Skip</button>
          <button onClick={() => { if (rating > 0) { onSubmit(rating, comment); onClose(); } }}
            style={{ flex: 2, background: rating > 0 ? 'var(--gold)' : 'var(--surface-2)', color: rating > 0 ? '#000' : 'var(--text-3)', border: 'none', borderRadius: 'var(--radius-pill)', padding: '11px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.875rem', cursor: rating > 0 ? 'pointer' : 'default', transition: 'all 0.15s' }}>
            Submit Rating
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const TrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [liveDriverLocation, setLiveDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Order-service poll (status + order details)
  const { data: order, isLoading } = useTrackOrderQuery(orderId || '', {
    skip: !orderId,
    pollingInterval: 10000,
  });

  // Delivery-service poll (driver location + ETA) — only when DISPATCHED
  const isDispatched = order?.status === 'DISPATCHED';
  const { data: delivery, isLoading: deliveryLoading } = useDeliveryTrackQuery(orderId!, {
    skip: !orderId || !isDispatched,
    pollingInterval: 8000,
  });

  // WebSocket for real-time location pushes
  const { isConnected: wsConnected } = useOrderTrackingWebSocket({
    orderId: orderId || '',
    onOrderUpdate: (update: OrderTrackingUpdate) => {
      if (update.status) setLiveStatus(update.status);
      if (update.driverLocation) setLiveDriverLocation(update.driverLocation);
    },
    enabled: !!orderId && isDispatched,
  });

  // Normalize driver location — WS gives {latitude, longitude}, delivery API gives GeoJSON {type, coordinates:[lng,lat]}
  const effectiveDriverLocation: { latitude: number; longitude: number } | null = liveDriverLocation
    ?? (delivery?.currentLocation
      ? { latitude: delivery.currentLocation.coordinates[1], longitude: delivery.currentLocation.coordinates[0] }
      : null);
  const effectiveStatus = liveStatus || order?.status;

  useEffect(() => { dispatch(clearCart()); }, [dispatch]);
  useEffect(() => { if (orderId) sessionStorage.setItem('activeOrderId', orderId); }, [orderId]);
  useEffect(() => {
    if (order?.status === 'DELIVERED') setTimeout(() => sessionStorage.removeItem('activeOrderId'), 60000);
  }, [order?.status]);

  useEffect(() => {
    if (!order?.createdAt) return;
    const tick = () => setElapsedTime(Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [order?.createdAt]);

  // ── Status helpers ──────────────────────────────────────────────────────────
  const currentStepIndex = order
    ? ORDER_STEPS.findIndex(s => s.status === (effectiveStatus || order.status))
    : 0;
  const isDelivered = effectiveStatus === 'DELIVERED' || effectiveStatus === 'COMPLETED';
  const shortId = orderId ? orderId.slice(-8).toUpperCase() : '';

  const etaMinutes = delivery?.estimatedArrival
    ? Math.max(0, Math.round((new Date(delivery.estimatedArrival).getTime() - Date.now()) / 60000))
    : null;

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)' }}>
        <CustomerPageHeader onBack={() => navigate('/menu')} breadcrumb="Track Order" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, border: '3px solid var(--border)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>Loading your order…</p>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!order || !orderId) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)' }}>
        <CustomerPageHeader onBack={() => navigate('/menu')} breadcrumb="Track Order" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 10 }}>Order Not Found</h2>
            <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', marginBottom: 28, lineHeight: 1.6 }}>We couldn't find this order. Check your confirmation email or contact support.</p>
            <button onClick={() => navigate('/menu')} style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#c0392b,#e74c3c)', color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}>Back to Menu</button>
          </div>
        </div>
      </div>
    );
  }

  const activeStep = ORDER_STEPS[currentStepIndex];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)' }}>
      <CustomerPageHeader onBack={() => navigate('/menu')} breadcrumb="Track Order" />

      <div style={{ flex: 1, padding: '28px 20px 60px', maxWidth: 1120, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* ── Hero status bar ──────────────────────────────────────────────── */}
        <div style={{
          background: isDelivered ? 'rgba(34,197,94,0.07)' : isDispatched ? 'rgba(59,130,246,0.07)' : 'rgba(212,175,55,0.06)',
          border: `1px solid ${isDelivered ? 'rgba(34,197,94,0.2)' : isDispatched ? 'rgba(59,130,246,0.2)' : 'rgba(212,175,55,0.2)'}`,
          borderRadius: 18, padding: '22px 28px', marginBottom: 28,
          display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
        }}>
          {/* Animated icon for dispatched, otherwise static */}
          <div style={{
            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
            background: isDelivered ? 'rgba(34,197,94,0.12)' : isDispatched ? 'rgba(59,130,246,0.12)' : 'rgba(212,175,55,0.1)',
            border: `2px solid ${isDelivered ? 'rgba(34,197,94,0.4)' : isDispatched ? 'rgba(59,130,246,0.35)' : 'rgba(212,175,55,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: isDispatched && !isDelivered ? 'pulse-truck 2s ease-in-out infinite' : 'none',
          }}>
            <IconTruck size={24} color={isDelivered ? '#22c55e' : isDispatched ? '#60a5fa' : 'var(--gold)'} />
          </div>

          <div style={{ flex: 1, minWidth: 180 }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4 }}>Current Status</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: 2 }}>
              {activeStep?.label ?? (effectiveStatus || order.status)}
            </h1>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {activeStep?.description}
              {elapsedTime > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><IconClock size={12} color="var(--text-3)" />{elapsedTime}m ago</span>}
            </p>
          </div>

          {/* Right: ETA chip (delivery) or step chip (others) */}
          {isDispatched && !isDelivered ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
              {etaMinutes !== null && (
                <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 12, padding: '10px 18px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 2 }}>Arrives in</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#60a5fa' }}>{etaMinutes} min</p>
                  {delivery?.distanceRemaining && (
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{delivery.distanceRemaining.toFixed(1)} km away</p>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: wsConnected ? '#4ade80' : '#f59e0b', display: 'inline-block', boxShadow: wsConnected ? '0 0 0 3px rgba(74,222,128,0.2)' : 'none' }} />
                <span style={{ fontSize: '0.68rem', color: wsConnected ? '#4ade80' : '#f59e0b', fontWeight: 600 }}>{wsConnected ? 'Live' : 'Polling'}</span>
              </div>
            </div>
          ) : !isDelivered ? (
            <div style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 10, padding: '10px 18px', textAlign: 'center', flexShrink: 0 }}>
              <p style={{ fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 2 }}>ETA</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold)' }}>
                {currentStepIndex >= 0 ? ORDER_STEPS.slice(currentStepIndex).length * 5 + '–' + (ORDER_STEPS.slice(currentStepIndex).length * 5 + 5) + ' min' : '–'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 2 }}>Status</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#22c55e' }}>Delivered</p>
              </div>
            </div>
          )}
        </div>

        {/* ── DISPATCHED: Live delivery panel ─────────────────────────────── */}
        {isDispatched && !isDelivered && (
          <div style={{ marginBottom: 28 }}>

            {/* Driver card */}
            {(delivery?.driverName || deliveryLoading) && (
              <div style={{
                background: 'var(--surface)', border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 16, padding: '22px 24px', marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
              }}>
                {/* Driver avatar */}
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', border: '2px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4 }}>Your Driver</p>
                  <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>
                    {deliveryLoading ? '—' : (delivery?.driverName || 'Driver Assigned')}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                    {delivery?.driverPhone || ''}
                    {delivery?.distanceRemaining ? ` · ${delivery.distanceRemaining.toFixed(1)} km away` : ''}
                  </p>
                </div>

                {/* Call + Rate actions */}
                <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                  {delivery?.driverPhone && (
                    <a
                      href={`tel:${delivery.driverPhone}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '9px 18px', borderRadius: 'var(--radius-pill)',
                        background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                        color: '#4ade80', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none',
                      }}
                    >
                      <IconPhone size={13} color="#4ade80" />
                      Call Driver
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Live map */}
            <div ref={mapRef} style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)', position: 'relative' }}>
              {effectiveDriverLocation && delivery?.destination ? (
                <DriverTrackingMap
                  driverPosition={[effectiveDriverLocation.latitude, effectiveDriverLocation.longitude]}
                  restaurantPosition={[17.4399, 78.4983]}
                  customerPosition={[
                    delivery.destination.coordinates[1],
                    delivery.destination.coordinates[0],
                  ]}
                  eta={etaMinutes !== null ? `${etaMinutes} min` : undefined}
                  driverName={delivery?.driverName}
                  height="440px"
                  autoCenter
                />
              ) : (
                /* Map placeholder while driver location loads */
                <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: '#60a5fa', animation: 'spin 1s linear infinite' }} />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Connecting to driver…</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>Driver location will appear once GPS signal is received</p>
                  </div>
                </div>
              )}

              {/* Map label overlay */}
              {effectiveDriverLocation && (
                <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, zIndex: 500 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'blink 1.4s ease-in-out infinite' }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#fff' }}>Live driver location</span>
                </div>
              )}
            </div>

            {/* Delivery address strip */}
            {order.deliveryAddress && (
              <div style={{ marginTop: 12, padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4 }}>Delivering to</p>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-1)', fontWeight: 500, lineHeight: 1.5 }}>
                    {[order.deliveryAddress.street, order.deliveryAddress.city, order.deliveryAddress.state, order.deliveryAddress.pincode].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Delivered: Rating prompt ─────────────────────────────────────── */}
        {isDelivered && (
          <div style={{ marginBottom: 28, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconCheck size={22} color="#22c55e" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>Your order has arrived!</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>Hope you enjoy your meal. Rate your experience below.</p>
            </div>
            <button onClick={() => setRatingOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 'var(--radius-pill)', background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.3)', color: 'var(--gold)', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,168,67,0.2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,168,67,0.12)'; }}
            >
              <IconStar size={14} color="var(--gold)" />
              Rate Delivery
            </button>
          </div>
        )}

        {/* ── Two-column: Timeline + Order summary ─────────────────────────── */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* LEFT: Progress timeline */}
          <div style={{ flex: '1 1 320px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 20px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 22, letterSpacing: '0.02em' }}>Order Progress</h2>

            <div style={{ position: 'relative' }}>
              {ORDER_STEPS.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isActive = index === currentStepIndex;
                const isFuture = index > currentStepIndex;
                const lineColor = isCompleted ? 'rgba(34,197,94,0.4)' : 'var(--border)';

                return (
                  <div key={step.status} style={{ display: 'flex', gap: 14, position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 30, flexShrink: 0 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: isCompleted ? 'rgba(34,197,94,0.12)' : isActive ? (isDispatched ? 'rgba(59,130,246,0.12)' : 'rgba(212,175,55,0.12)') : 'transparent',
                        border: `2px solid ${isCompleted ? 'rgba(34,197,94,0.5)' : isActive ? (isDispatched ? 'rgba(59,130,246,0.5)' : 'rgba(212,175,55,0.5)') : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isCompleted ? '#22c55e' : isActive ? (isDispatched ? '#60a5fa' : 'var(--gold)') : 'var(--text-3)',
                        position: 'relative', zIndex: 1, transition: 'all 0.3s',
                        boxShadow: isActive ? (isDispatched ? '0 0 0 4px rgba(59,130,246,0.1)' : '0 0 0 4px rgba(212,175,55,0.1)') : 'none',
                        animation: isActive && isDispatched ? 'pulse-ring-blue 2s ease-in-out infinite' : 'none',
                      }}>
                        {isCompleted
                          ? <IconCheck size={13} color="#22c55e" />
                          : <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: isFuture ? 0.4 : 1 }}>{index + 1}</span>
                        }
                      </div>
                      {index < ORDER_STEPS.length - 1 && (
                        <div style={{ width: 2, flex: 1, minHeight: 22, background: lineColor, margin: '3px 0', transition: 'background 0.4s' }} />
                      )}
                    </div>

                    <div style={{ paddingBottom: index < ORDER_STEPS.length - 1 ? 20 : 0, paddingTop: 4 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: isActive ? 700 : isCompleted ? 600 : 400, color: isActive ? 'var(--text-1)' : isCompleted ? 'var(--text-2)' : 'var(--text-3)', marginBottom: 2, transition: 'color 0.3s' }}>
                        {step.label}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', opacity: isFuture ? 0.45 : 0.85 }}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Order summary */}
          <div style={{ flex: '1 1 300px', position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Reference card */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                <div>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4 }}>Order Reference</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--gold)' }}>#{shortId}</p>
                </div>
                <span style={{
                  background: isDelivered ? 'rgba(34,197,94,0.1)' : isDispatched ? 'rgba(59,130,246,0.1)' : 'rgba(212,175,55,0.08)',
                  border: `1px solid ${isDelivered ? 'rgba(34,197,94,0.3)' : isDispatched ? 'rgba(59,130,246,0.25)' : 'rgba(212,175,55,0.25)'}`,
                  color: isDelivered ? '#22c55e' : isDispatched ? '#60a5fa' : 'var(--gold)',
                  fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em', padding: '4px 10px', borderRadius: 20,
                }}>
                  {isDelivered ? 'Delivered' : isDispatched ? 'En Route' : 'Active'}
                </span>
              </div>
              {order.customerName && <OrderMeta label="Customer" value={order.customerName} />}
              {order.orderType && <OrderMeta label="Type" value={order.orderType} />}
              {order.paymentMethod && <OrderMeta label="Payment" value={order.paymentMethod} />}
            </div>

            {/* Items */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 22px' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 14 }}>Items</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {order.items?.map((item: OrderItem, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>{item.quantity}</span>
                      <span style={{ fontSize: '0.86rem', color: 'var(--text-2)' }}>{item.name}</span>
                    </div>
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-1)', flexShrink: 0 }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-1)' }}>Total</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold)' }}>₹{order.total?.toFixed(0)}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => navigate('/menu')} style={{ width: '100%', padding: 13, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#c0392b,#e74c3c)', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              >
                Order Again
              </button>
              {isDelivered && currentUser && (
                <button onClick={() => navigate('/customer-dashboard')} style={{ width: '100%', padding: 13, borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
                >
                  View Order History
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating dialog */}
      <RatingDialog
        open={ratingOpen}
        driverName={delivery?.driverName}
        onClose={() => setRatingOpen(false)}
        onSubmit={(rating, comment) => {
          console.log('[TrackingPage] Rating submitted', { orderId, rating, comment });
          setRatingOpen(false);
        }}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes pulse-truck {
          0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
          50%      { box-shadow: 0 0 0 8px rgba(59,130,246,0.15); }
        }
        @keyframes pulse-ring-blue {
          0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          70%  { box-shadow: 0 0 0 8px rgba(59,130,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
      `}</style>
    </div>
  );
};

export default TrackingPage;
