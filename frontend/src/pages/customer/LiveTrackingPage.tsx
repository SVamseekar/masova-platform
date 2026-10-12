import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, CircleAlert, Clock, MapPin, MessageCircle, Phone, Store as StoreIcon } from 'lucide-react';
import BrowseShell from '../../apps/PublicWebsite/components/BrowseShell';
import { storeDisplayName } from '../../apps/PublicWebsite/components/CustomerStoreSelector';
import { useTrackOrderQuery } from '../../store/api/deliveryApi';
import { useGetActiveStoresQuery } from '../../store/api/storeApi';
import { DriverTrackingMap } from '../../components/delivery/DriverTrackingMap';
import { useOrderTrackingWebSocket } from '../../hooks/useOrderTrackingWebSocket';
import { OrderTrackingUpdate } from '../../services/websocketService';
import { SUPPORT_EMAIL } from '../../apps/ProductSite/constants';
import { displayOrderNumber, useCustomerOrder } from './useCustomerOrder';
import './Tracking.css';

const STAGES = ['Dispatched', 'Out for delivery', 'Delivered'];
const stageIndex = (status?: string) => {
  const value = (status || '').toUpperCase();
  if (['DELIVERED', 'COMPLETED'].includes(value)) return 2;
  if (['OUT_FOR_DELIVERY', 'IN_TRANSIT', 'PICKED_UP'].includes(value)) return 1;
  return 0;
};
/** The delivery service sends GeoJSON points ([lng, lat]); socket updates send latitude and longitude. */
function toLatLng(point: unknown): { latitude: number; longitude: number } | null {
  if (!point || typeof point !== 'object') return null;
  const { coordinates, latitude, longitude } = point as { coordinates?: unknown; latitude?: unknown; longitude?: unknown };
  if (Array.isArray(coordinates) && typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') return { latitude: coordinates[1], longitude: coordinates[0] };
  if (typeof latitude === 'number' && typeof longitude === 'number') return { latitude, longitude };
  return null;
}
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('');

/** Board 06 panel 4. Live position comes from the delivery service; nothing is simulated. */
const LiveTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [liveLocation, setLiveLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const onOrderUpdate = useCallback((update: OrderTrackingUpdate) => {
    if (update.status) setLiveStatus(update.status);
    if (update.driverLocation) setLiveLocation(update.driverLocation);
  }, []);
  const { isConnected } = useOrderTrackingWebSocket({ orderId: orderId || '', onOrderUpdate, enabled: !!orderId });
  // Clock for the arrival countdown, refreshed between position updates.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  const tracking = useTrackOrderQuery(orderId || '', { skip: !orderId, pollingInterval: isConnected ? 30000 : 10000 });
  const { order } = useCustomerOrder(orderId, 30000);
  const stores = useGetActiveStoresQuery();

  const back = <Link className="track-back" to={orderId ? `/tracking/${encodeURIComponent(orderId)}` : '/menu'}><ArrowLeft size={16} aria-hidden="true" />Back to order</Link>;
  const data = tracking.data;

  if (tracking.isLoading) return <BrowseShell><main className="track-page">{back}<div className="track-state" role="status"><Clock size={36} aria-hidden="true" /><h1>Loading tracking information…</h1></div></main></BrowseShell>;
  if (!data) {
    const waiting = !tracking.error || (tracking.error as { status?: number | string }).status === 404;
    return <BrowseShell><main className="track-page">{back}<div className="track-state" role="alert"><CircleAlert size={36} aria-hidden="true" /><h1>{waiting ? 'Tracking not available' : 'Tracking could not be loaded'}</h1><p>{waiting ? 'Live tracking starts when a driver is assigned to your order.' : 'Check your connection and try again.'}</p><button type="button" className="browse-primary" onClick={() => tracking.refetch()}>Check again</button></div></main></BrowseShell>;
  }
  if (data.orderType && data.orderType !== 'DELIVERY') return <BrowseShell><main className="track-page">{back}<div className="track-state" role="status"><CircleAlert size={36} aria-hidden="true" /><h1>Live tracking unavailable</h1><p>{data.orderType === 'PICKUP' ? 'Live tracking is not available for pickup orders.' : 'Live tracking is not available for dine-in orders.'}</p></div></main></BrowseShell>;

  // A socket status can go stale when the socket drops; the order's own final state wins.
  const cancelled = [order?.status, data.status, liveStatus].some(value => (value || '').toUpperCase() === 'CANCELLED');
  const status = [liveStatus, data.status, order?.status].map(value => (value || '').toUpperCase()).reduce((best, value) => stageIndex(value) > stageIndex(best) ? value : best, '');
  const stage = stageIndex(status);
  const delivered = stage === 2;
  const driver = liveLocation ?? toLatLng(data.currentLocation);
  const destinationPoint = toLatLng(data.destination);
  const destination = destinationPoint ? [destinationPoint.latitude, destinationPoint.longitude] as [number, number] : null;
  const store = stores.data?.find(candidate => candidate.id === order?.storeId || candidate.storeCode === order?.storeId);
  const storePosition = store?.address?.latitude != null && store.address.longitude != null ? [store.address.latitude, store.address.longitude] as [number, number] : null;
  const eta = data.estimatedArrival ? new Date(data.estimatedArrival) : null;
  const etaMinutes = eta && !Number.isNaN(eta.getTime()) ? Math.max(0, Math.round((eta.getTime() - now) / 60000)) : null;
  const updated = data.lastUpdated ? new Date(data.lastUpdated) : null;
  const updatedText = updated && !Number.isNaN(updated.getTime()) ? updated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : null;

  return <BrowseShell>
    <main className="track-page">
      {back}
      <div className="track-title">
        <h1>{order ? `Order #${displayOrderNumber(order.orderNumber)}` : 'Live delivery'}</h1>
        <span className="track-chip" data-tone={cancelled ? 'error' : stage === 0 ? 'info' : 'success'}>{cancelled ? 'Cancelled' : STAGES[stage]}</span>
      </div>
      <p className="track-date">{order ? new Date(order.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ' '}</p>

      <div className="track-live">
        <div className="track-side">
          <section className="track-card track-map" aria-label="Delivery map">
            <div className="track-map-status" data-live={isConnected} role="status"><strong>{isConnected ? 'GPS · Live' : 'GPS · Updating every 10 seconds'}</strong>{updatedText && <span>Last update: {updatedText}</span>}</div>
            {driver && destination
              ? <DriverTrackingMap driverPosition={[driver.latitude, driver.longitude]} restaurantPosition={storePosition ?? undefined} customerPosition={destination} eta={etaMinutes !== null ? `${etaMinutes} min` : undefined} driverName={data.driverName} height="420px" autoCenter />
              : <div className="track-map-empty"><MapPin size={32} aria-hidden="true" /><strong>Waiting for the driver's position</strong><span>The map appears when the driver's phone shares a location.</span></div>}
          </section>
          <section className="track-card track-store">
            <span className="track-store-mark"><StoreIcon size={24} aria-hidden="true" /></span>
            <div className="track-store-text"><strong>{store ? storeDisplayName(store.name) : 'Your MaSoVa store'}</strong>{store?.address && <span>{[store.address.street, store.address.city].filter(Boolean).join(', ')}</span>}</div>
            {orderId && <Link className="track-action" to={`/tracking/${encodeURIComponent(orderId)}`}>View order details</Link>}
          </section>
        </div>

        <div className="track-side">
          <section className="track-card" aria-label="Delivery driver">
            <h2>Delivery driver</h2>
            <div className="track-driver">
              <span className="track-avatar" aria-hidden="true">{data.driverName ? initials(data.driverName) : '–'}</span>
              <div><strong>{data.driverName || 'Driver being assigned'}</strong><span>{cancelled ? 'Order cancelled' : delivered ? 'Delivery complete' : 'Delivering your order'}</span></div>
              {data.driverPhone && !delivered && !cancelled && <a className="track-call" href={`tel:${data.driverPhone}`} aria-label={`Call driver ${data.driverName || ''}`.trim()}><Phone size={20} aria-hidden="true" /></a>}
            </div>
            {!delivered && !cancelled && <p className="track-eta"><small>Estimated arrival</small><strong>{etaMinutes !== null ? (etaMinutes <= 1 ? 'Arriving now' : `${etaMinutes} minutes`) : 'Calculating…'}</strong></p>}
            <ol className="track-timeline" aria-label="Delivery progress">
              {STAGES.map((label, index) => <li key={label} data-state={index < stage || (delivered && index === stage) ? 'done' : index === stage ? 'current' : 'todo'} aria-current={index === stage ? 'step' : undefined}>{label}</li>)}
            </ol>
            {data.deliveryOtp && !delivered && !cancelled && <div className="track-banner" data-tone="info" style={{ margin: '16px 0 0' }}><div><strong>Delivery code</strong><span>Give this code to your driver.</span></div><span className="track-otp">{data.deliveryOtp}</span></div>}
          </section>
          <a className="track-card track-help" href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Help with delivery' + (order ? ' for order ' + order.orderNumber : ''))}`}>
            <MessageCircle size={22} aria-hidden="true" />
            <div><strong>Need help with your delivery?</strong><span>Send us a message</span></div>
            <ChevronRight size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
    </main>
  </BrowseShell>;
};

export default LiveTrackingPage;
