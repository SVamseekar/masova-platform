import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AllergenType, ALLERGEN_SHORT } from '../../constants/allergens';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import AppHeader from '../../components/common/AppHeader';
import RecipeViewer from '../../components/RecipeViewer';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectSelectedStoreId, setSelectedStore, setStoreCurrency } from '../../store/slices/cartSlice';
import { useGetActiveStoresQuery } from '../../store/api/storeApi';
import { storeCurrencyPayload, resolveStoreMarket } from '../../utils/storeCurrency';
import {
  useGetKitchenQueueQuery,
  useUpdateOrderStatusMutation,
  Order as ApiOrder,
} from '../../store/api/orderApi';
import { useGetAllMenuItemsQuery, MenuItem } from '../../store/api/menuApi';
import { useKitchenWebSocket } from '../../hooks/useKitchenWebSocket';
import { KitchenOrder } from '../../services/websocketService';
import { kds } from './kdsTokens';
import {
  COOK_STATUSES,
  HANDOFF_STATUSES,
  COLUMN_META,
  sortKitchenTickets,
  filterByStatus,
  elapsedMinutes,
  formatElapsed,
  kdsTicketCode,
  parseKitchenInstant,
  urgencyBand,
  isStaleWait,
  nextKitchenStatus,
  terminalStatusForType,
  mapApiOrderType,
  computeQueueMetrics,
  ovenRemainingLabel,
  type KdsOrderType,
  type KdsStatus,
} from './kdsHelpers';

// ─── Allergen badges (exported for unit tests) ───────────────────────────────

export const AllergenBadge: React.FC<{ allergen: AllergenType }> = ({ allergen }) => (
  <span
    title={allergen}
    style={{
      display: 'inline-block',
      background: `${kds.warning}33`,
      border: `1px solid ${kds.warning}`,
      color: kds.warningDark,
      fontSize: kds.type.fontSize.xs,
      fontWeight: kds.type.fontWeight.bold,
      padding: '4px 8px',
      borderRadius: kds.radius.sm,
      marginRight: 4,
      letterSpacing: '0.05em',
      minHeight: 28,
      lineHeight: '20px',
    }}
  >
    {ALLERGEN_SHORT[allergen]}
  </span>
);

export const AllergenBadgeList: React.FC<{ allergens: AllergenType[] }> = ({ allergens }) => {
  if (!allergens || allergens.length === 0) return null;
  return (
    <span data-testid="allergen-badges">
      {allergens.map((a) => (
        <AllergenBadge key={a} allergen={a} />
      ))}
    </span>
  );
};

// Brand colors for third-party aggregators (external brands — not design tokens)
const AGGREGATOR_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  WOLT: { label: 'Wolt', bg: '#009DE0', color: kds.inverse },
  DELIVEROO: { label: 'Deliveroo', bg: '#00CCBC', color: kds.inverse },
  JUST_EAT: { label: 'Just Eat', bg: '#FF8000', color: kds.inverse },
  UBER_EATS: { label: 'Uber Eats', bg: '#000000', color: kds.inverse },
};

const COLUMN_COLORS: Record<string, string> = {
  RECEIVED: kds.info,
  PREPARING: kds.warning,
  OVEN: kds.role,
  BAKED: kds.success,
  READY: kds.successDark,
  DISPATCHED: kds.infoDark,
  OUT_FOR_DELIVERY: kds.infoDark,
  SERVED: kds.muted,
  COMPLETED: kds.successDark,
};

// ─── Local ticket model ──────────────────────────────────────────────────────

interface OrderItem {
  name: string;
  size: string | null;
  toppings: string[];
  quantity: number;
  allergens?: AllergenType[];
}

interface Ticket {
  id: string;
  orderNumber: string;
  status: KdsStatus | string;
  items: OrderItem[];
  receivedAt: Date;
  estimatedPrepTime: number;
  customer: string;
  orderType: KdsOrderType;
  priority: 'NORMAL' | 'URGENT';
  orderSource?: string;
  specialInstructions?: string;
  actualOvenTime?: number;
  prepEstimateLabel?: string;
}

// ─── Shared styles (tokens only) ─────────────────────────────────────────────

const touchBtnBase: React.CSSProperties = {
  minHeight: kds.touchMin,
  minWidth: kds.touchMin,
  border: 'none',
  borderRadius: kds.radius.md,
  fontFamily: kds.font,
  fontWeight: kds.type.fontWeight.bold,
  fontSize: kds.type.fontSize.sm,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '12px 18px',
  transition: 'transform 0.12s ease, opacity 0.12s ease',
};

// ─── Page ────────────────────────────────────────────────────────────────────

const KitchenDisplayPage: React.FC = () => {
  const dispatch = useDispatch();
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [selectedRecipeItem, setSelectedRecipeItem] = useState<MenuItem | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showHandoff, setShowHandoff] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const prevReceivedCountRef = useRef(0);
  const currentUser = useAppSelector(selectCurrentUser);
  const selectedStoreIdFromRedux = useAppSelector(selectSelectedStoreId);
  const { data: stores = [] } = useGetActiveStoresQuery();
  const { storeId: urlStoreId } = useParams<{ storeId?: string }>();

  const syncStoreContext = useCallback(
    (storeId: string, storeName: string) => {
      const match = stores.find((s) => s.storeCode === storeId || s.id === storeId);
      dispatch(setSelectedStore({ storeId, storeName }));
      if (match && resolveStoreMarket(match).resolved) {
        dispatch(setStoreCurrency(storeCurrencyPayload(match)));
      }
    },
    [dispatch, stores]
  );

  useEffect(() => {
    if (urlStoreId && urlStoreId !== selectedStoreIdFromRedux) {
      syncStoreContext(urlStoreId, urlStoreId.toUpperCase());
    }
  }, [urlStoreId, selectedStoreIdFromRedux, syncStoreContext]);

  const storeId = urlStoreId || selectedStoreIdFromRedux || currentUser?.storeId || '';

  const [localOrders, setLocalOrders] = useState<ApiOrder[]>([]);

  const handleWebSocketOrderUpdate = useCallback((wsOrder: KitchenOrder) => {
    setLocalOrders((prevOrders) => {
      const existingIndex = prevOrders.findIndex((o) => o.id === wsOrder.id);
      if (existingIndex >= 0) {
        const updated = [...prevOrders];
        updated[existingIndex] = {
          ...updated[existingIndex],
          status: wsOrder.status as ApiOrder['status'],
          orderNumber: wsOrder.orderNumber,
          items: wsOrder.items.map((item) => ({
            menuItemId: item.menuItemId || '',
            name: item.name,
            quantity: item.quantity,
            variant: item.variant,
            customizations: item.customizations,
            price: 0,
          })),
        };
        return updated;
      }
      const newOrder: ApiOrder = {
        id: wsOrder.id,
        orderNumber: wsOrder.orderNumber,
        status: wsOrder.status as ApiOrder['status'],
        items: wsOrder.items.map((item) => ({
          menuItemId: item.menuItemId || '',
          name: item.name,
          quantity: item.quantity,
          variant: item.variant,
          customizations: item.customizations,
          price: 0,
        })),
        customerName: wsOrder.customerName,
        orderType: wsOrder.orderType as ApiOrder['orderType'],
        priority: wsOrder.priority as ApiOrder['priority'],
        preparationTime: wsOrder.preparationTime,
        createdAt: wsOrder.createdAt,
        updatedAt: wsOrder.createdAt,
        storeId: wsOrder.storeId,
        subtotal: 0,
        deliveryFee: 0,
        tax: 0,
        total: 0,
        totalAmount: 0,
        paymentStatus: 'PENDING' as const,
      };
      return [...prevOrders, newOrder];
    });
  }, []);

  const { isConnected: wsConnected, error: wsError } = useKitchenWebSocket({
    storeId,
    onOrderUpdate: handleWebSocketOrderUpdate,
    enabled: !!storeId,
  });

  const {
    data: apiOrders = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetKitchenQueueQuery(storeId || undefined, {
    skip: !storeId,
    pollingInterval: wsConnected ? 30_000 : 5_000,
    refetchOnMountOrArgChange: true,
  });

  // Always sync API → local (including empty queue — never leave stale tickets)
  useEffect(() => {
    setLocalOrders(apiOrders);
  }, [apiOrders]);

  const { data: menuItems = [] } = useGetAllMenuItemsQuery(undefined);
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  const menuByName = useMemo(() => {
    const map = new Map<string, MenuItem>();
    for (const m of menuItems) {
      map.set(m.name.toLowerCase(), m);
    }
    return map;
  }, [menuItems]);

  const findMenuItemByName = useCallback(
    (itemName: string): MenuItem | null => menuByName.get(itemName.toLowerCase()) ?? null,
    [menuByName]
  );

  const playNewOrderChime = useCallback(() => {
    if (isMuted) return;
    try {
      const AudioContextCtor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;
      const audioCtx = new AudioContextCtor();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio not available:', e);
    }
  }, [isMuted]);

  const receivedOrderCount = localOrders.filter((o) => o.status === 'RECEIVED').length;
  useEffect(() => {
    if (receivedOrderCount > prevReceivedCountRef.current) {
      playNewOrderChime();
    }
    prevReceivedCountRef.current = receivedOrderCount;
  }, [receivedOrderCount, playNewOrderChime]);

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullScreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullScreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') toggleFullScreen();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleFullScreen]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const tickets: Ticket[] = useMemo(
    () =>
      localOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        items: order.items.map((item) => {
          const menu = findMenuItemByName(item.name);
          return {
            name: item.name,
            size: item.variant || null,
            toppings: item.customizations || [],
            quantity: item.quantity,
            allergens: menu?.allergens,
          };
        }),
        receivedAt: parseKitchenInstant(order.createdAt),
        estimatedPrepTime: order.preparationTime || 15,
        customer: order.customerName,
        orderType: mapApiOrderType(order.orderType),
        priority: order.priority === 'URGENT' ? 'URGENT' : 'NORMAL',
        orderSource: order.orderSource,
        specialInstructions: order.specialInstructions,
        actualOvenTime: order.actualOvenTime,
        prepEstimateLabel:
          order.preparationTime != null ? `${order.preparationTime}m` : '',
      })),
    [localOrders, findMenuItemByName]
  );

  const metrics = useMemo(
    () => computeQueueMetrics(tickets, currentTime),
    [tickets, currentTime]
  );

  const moveOrderToNext = async (ticket: Ticket): Promise<void> => {
    const nextStatus = nextKitchenStatus(ticket.status, ticket.orderType);
    if (!nextStatus) return;
    setActionError(null);
    setUpdatingOrderId(ticket.id);
    try {
      await updateOrderStatus({
        orderId: ticket.id,
        status: nextStatus as ApiOrder['status'],
      }).unwrap();
      refetch();
    } catch (err) {
      console.error('Failed to update order status:', err);
      setActionError(`Could not advance #${ticket.orderNumber}. Check connection and try again.`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const markAsCompleted = async (ticket: Ticket): Promise<void> => {
    const terminal = terminalStatusForType(ticket.orderType);
    if (!terminal) return;
    setActionError(null);
    setUpdatingOrderId(ticket.id);
    try {
      await updateOrderStatus({
        orderId: ticket.id,
        status: terminal as ApiOrder['status'],
      }).unwrap();
      refetch();
    } catch (err) {
      console.error('Failed to mark order as completed:', err);
      setActionError(`Could not complete #${ticket.orderNumber}. Check connection and try again.`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const bandColor = (band: ReturnType<typeof urgencyBand>) => {
    if (band === 'critical') return kds.error;
    if (band === 'warn') return kds.warning;
    return kds.success;
  };

  const renderTicket = (ticket: Ticket) => {
    const mins = elapsedMinutes(ticket.receivedAt, currentTime);
    const band = urgencyBand(mins);
    const isUpdating = updatingOrderId === ticket.id;
    const next = nextKitchenStatus(ticket.status, ticket.orderType);
    const showNext =
      next != null &&
      !(ticket.status === 'DISPATCHED' || (ticket.status === 'READY' && ticket.orderType !== 'DELIVERY'));
    const oven = ovenRemainingLabel({
      status: ticket.status,
      actualOvenTime: ticket.actualOvenTime,
      now: currentTime,
      estimateMinutes: 7,
    });
    const agg =
      ticket.orderSource && ticket.orderSource !== 'MASOVA'
        ? AGGREGATOR_BADGE[ticket.orderSource]
        : null;

    const showNote = ticket.specialInstructions && !/^seed order/i.test(ticket.specialInstructions.trim());
    const waitLabel = isStaleWait(mins) ? 'stale' : formatElapsed(mins);

    return (
      <article
        key={ticket.id}
        className={`kds-ticket${ticket.priority === 'URGENT' ? ' kds-ticket--urgent' : ''}${isStaleWait(mins) ? ' kds-ticket--stale' : ''}`}
        data-testid={`kds-ticket-${ticket.orderNumber}`}
        style={{ borderLeftColor: isStaleWait(mins) ? kds.muted : bandColor(band) }}
      >
        <header className="kds-ticket__head">
          <div className="kds-ticket__number">#{kdsTicketCode(ticket.orderNumber)}</div>
          <span
            className="kds-elapsed"
            style={{ color: isStaleWait(mins) ? kds.muted : bandColor(band) }}
            title="Wait since received"
          >
            {waitLabel}
          </span>
        </header>

        <div className="kds-ticket__customer">
          <span className="kds-ticket__name">{ticket.customer || 'Guest'}</span>
          <span className={`kds-type kds-type--${ticket.orderType.toLowerCase()}`}>
            {ticket.orderType === 'COLLECTION' ? 'Pickup' : ticket.orderType === 'DINE_IN' ? 'Dine-in' : 'Delivery'}
          </span>
        </div>
        {ticket.priority === 'URGENT' && <span className="kds-urgent-badge">Rush</span>}
        {agg && (
          <span className="kds-ticket__agg" style={{ background: agg.bg, color: agg.color }}>
            {agg.label}
          </span>
        )}

        {showNote && (
          <p className="kds-ticket__notes" title={ticket.specialInstructions}>
            {ticket.specialInstructions}
          </p>
        )}

        <ul className="kds-ticket__items">
          {ticket.items.map((item, index) => (
            <li key={`${ticket.id}-${index}`} className="kds-item">
              <div className="kds-item__row">
                <span className="kds-item__qty">{item.quantity}</span>
                <span className="kds-item__name">{item.name}</span>
                {item.size && <span className="kds-item__size">{item.size}</span>}
                <button
                  type="button"
                  className="kds-recipe-btn"
                  onClick={() => {
                    const menuItem = findMenuItemByName(item.name);
                    if (menuItem) setSelectedRecipeItem(menuItem);
                  }}
                  title="Recipe"
                  aria-label={`Recipe for ${item.name}`}
                >
                  i
                </button>
              </div>
              {item.toppings.length > 0 && (
                <div className="kds-item__mods">{item.toppings.join(', ')}</div>
              )}
              {item.allergens && item.allergens.length > 0 && (
                <div className="kds-item__allergens">
                  <AllergenBadgeList allergens={item.allergens} />
                </div>
              )}
            </li>
          ))}
        </ul>

        {oven && !oven.isEstimate && (
          <div className="kds-oven" data-testid="oven-timer">
            <span className="kds-oven__value">{oven.text}</span>
          </div>
        )}
        {oven && oven.isEstimate && (
          <div className="kds-oven" data-testid="oven-timer">
            <span className="kds-oven__value">{oven.text}</span>
          </div>
        )}

        <footer className="kds-ticket__foot">
          {showNext && (
            <button
              type="button"
              className="kds-next-btn"
              onClick={() => void moveOrderToNext(ticket)}
              disabled={isUpdating}
            >
              {isUpdating ? '…' : 'Bump'}
            </button>
          )}
          {ticket.status === 'READY' && ticket.orderType === 'DINE_IN' && (
            <button type="button" className="kds-complete-btn" onClick={() => void markAsCompleted(ticket)} disabled={isUpdating}>
              {isUpdating ? '…' : 'Served'}
            </button>
          )}
          {ticket.status === 'READY' && ticket.orderType === 'COLLECTION' && (
            <button type="button" className="kds-complete-btn" onClick={() => void markAsCompleted(ticket)} disabled={isUpdating}>
              {isUpdating ? '…' : 'Picked up'}
            </button>
          )}
        </footer>
      </article>
    );
  };

  const renderColumn = (status: string, compact = false) => {
    const meta = COLUMN_META[status] ?? { title: status, short: status };
    const color = COLUMN_COLORS[status] ?? kds.muted;
    const columnOrders = sortKitchenTickets(filterByStatus(tickets, status));

    return (
      <section
        key={status}
        className={`kds-col${compact ? ' kds-col--compact' : ''}`}
        data-testid={`kds-column-${status}`}
        aria-label={meta.title}
      >
        <div className="kds-col__head" style={{ borderBottomColor: color }}>
          <div className="kds-col__title-row">
            <span className="kds-col__dot" style={{ background: color }} />
            <h3 className="kds-col__title">{meta.title}</h3>
          </div>
          <span className="kds-col__count">{columnOrders.length}</span>
        </div>
        <div className="kds-col__list">
          {columnOrders.length === 0 ? (
            <div className="kds-col-empty" role="status">
              <span className="kds-col-empty__text">No orders</span>
            </div>
          ) : (
            columnOrders.map(renderTicket)
          )}
        </div>
      </section>
    );
  };

  const storeLabel = storeId ? storeId.toUpperCase() : 'NO STORE';
  const clockLabel = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const noStore = !storeId;
  const showBoardLoading = isLoading && tickets.length === 0;
  const showBoardError = Boolean(error) && tickets.length === 0;
  const cookEmpty =
    !showBoardLoading &&
    !showBoardError &&
    !noStore &&
    COOK_STATUSES.every((s) => filterByStatus(tickets, s).length === 0);

  return (
    <div className="kds-root" data-testid="kds-root">
      <style>{KDS_CSS}</style>

      <AppHeader title={`Kitchen Display - ${storeLabel}`} hideStaffLogin={true} />

      {/* Summary / controls bar — high contrast ops chrome */}
      <div className="kds-summary" data-testid="kds-summary">
        <div className="kds-summary__kpis">
          {(
            [
              {
                label: 'Active',
                value: String(metrics.activeCount),
                color: kds.info,
              },
              {
                label: 'New',
                value: String(metrics.newCount),
                color: kds.role,
              },
              {
                label: 'Urgent',
                value: String(metrics.urgentCount),
                color: metrics.urgentCount > 0 ? kds.error : kds.muted,
              },
              {
                label: 'Avg Wait',
                value: formatElapsed(metrics.avgWaitMins),
                color: bandColor(urgencyBand(metrics.avgWaitMins)),
              },
              {
                label: 'Longest',
                value: formatElapsed(metrics.maxWaitMins),
                color: bandColor(urgencyBand(metrics.maxWaitMins)),
              },
            ] as const
          ).map((kpi) => (
            <div key={kpi.label} className="kds-kpi">
              <div className="kds-kpi__value" style={{ color: kpi.color }}>
                {kpi.value}
              </div>
              <div className="kds-kpi__label">{kpi.label}</div>
            </div>
          ))}
        </div>

        <div className="kds-summary__right">
          <div
            className={`kds-conn${wsConnected ? ' kds-conn--live' : ' kds-conn--poll'}`}
            data-testid="kds-connection"
            title={
              wsConnected
                ? 'Live WebSocket connected'
                : wsError
                  ? `WebSocket offline: ${wsError}. Polling every 5s.`
                  : 'Polling kitchen queue'
            }
          >
            <span className="kds-conn__dot" />
            <span>{wsConnected ? 'Live' : 'Polling'}</span>
            {isFetching && !isLoading && <span className="kds-conn__sync">sync</span>}
          </div>

          <time className="kds-clock" dateTime={currentTime.toISOString()}>
            {clockLabel}
          </time>

          <button
            type="button"
            className="kds-ctrl-btn"
            onClick={() => setIsMuted((m) => !m)}
            title={isMuted ? 'Unmute alerts' : 'Mute alerts'}
            style={{ minHeight: kds.touchMin }}
          >
            {isMuted ? 'Muted' : 'Sound'}
          </button>
          <button
            type="button"
            className="kds-ctrl-btn"
            onClick={toggleFullScreen}
            title="Toggle full screen (F)"
            style={{ minHeight: kds.touchMin }}
          >
            {isFullScreen ? 'Exit' : 'Fullscreen'}
          </button>
          <button
            type="button"
            className="kds-ctrl-btn"
            onClick={() => setShowHandoff((v) => !v)}
            style={{ minHeight: kds.touchMin }}
            aria-pressed={showHandoff}
          >
            {showHandoff ? 'Handoff on' : 'Handoff off'}
          </button>
        </div>
      </div>

      {actionError && (
        <div className="kds-action-error" role="alert" data-testid="kds-action-error">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="kds-action-error__dismiss">
            Dismiss
          </button>
        </div>
      )}

      <main className="kds-board" data-testid="kds-board">
        {noStore ? (
          <div className="kds-state kds-state--error" role="alert" data-testid="kds-no-store">
            <p className="kds-state__title">No store selected</p>
            <p className="kds-state__msg">
              Open <code>/kitchen/DOM001</code> or log in as kitchen staff assigned to a store.
            </p>
          </div>
        ) : showBoardLoading ? (
          <div className="kds-state" role="status" data-testid="kds-loading">
            <div className="kds-skeleton" />
            <p className="kds-state__title">Loading orders...</p>
            <p className="kds-state__msg">Fetching kitchen queue for {storeLabel}</p>
          </div>
        ) : showBoardError ? (
          <div className="kds-state kds-state--error" role="alert" data-testid="kds-error">
            <p className="kds-state__title">Error loading orders</p>
            <p className="kds-state__msg">
              Error loading orders. Please check if Order Service is running.
            </p>
            <button
              type="button"
              className="kds-retry-btn"
              onClick={() => void refetch()}
              style={{ ...touchBtnBase, background: kds.role, color: kds.inverse }}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {cookEmpty && (
              <div className="kds-board-empty" role="status" data-testid="kds-empty-board">
                <p className="kds-state__title">Kitchen queue is clear</p>
                <p className="kds-state__msg">
                  No active cook tickets for {storeLabel}. New orders appear here live.
                </p>
              </div>
            )}

            <div className="kds-cook-grid" data-testid="kds-cook-grid">
              {COOK_STATUSES.map((status) => renderColumn(status))}
            </div>

            {showHandoff && (
              <div className="kds-handoff" data-testid="kds-handoff">
                <div className="kds-handoff__label">Handoff</div>
                <div className="kds-handoff-grid">
                  {HANDOFF_STATUSES.map((status) => renderColumn(status, true))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {selectedRecipeItem && (
        <RecipeViewer menuItem={selectedRecipeItem} onClose={() => setSelectedRecipeItem(null)} />
      )}
    </div>
  );
};

/** Scoped KDS CSS — industrial cook-line */
const KDS_CSS = `
  .kds-root {
    font-family: ${kds.font};
    background: ${kds.surface};
    min-height: 100vh;
    margin: 0;
    padding: 0;
    color: ${kds.ink};
    -webkit-tap-highlight-color: transparent;
  }
  .kds-root *, .kds-root *::before, .kds-root *::after { box-sizing: border-box; }
  .kds-root header, .kds-root [class*="AppHeader"], .kds-root [data-testid="app-header"] {
    background: ${kds.surface} !important;
    color: ${kds.ink} !important;
    border-bottom: 1px solid ${kds.hairline} !important;
    box-shadow: none !important;
    min-height: 44px !important;
  }

  .kds-summary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 20px;
    padding: 10px 18px;
    background: ${kds.surfaceAlt};
    border-bottom: 1px solid ${kds.hairline};
    position: sticky;
    top: 0;
    z-index: 90;
  }
  .kds-summary__kpis { display: flex; flex-wrap: wrap; gap: 8px 22px; flex: 1; }
  .kds-kpi { min-width: 52px; }
  .kds-kpi__value {
    font-size: 1.35rem;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.03em;
  }
  .kds-kpi__label {
    margin-top: 4px;
    font-size: 0.68rem;
    color: ${kds.muted};
    font-weight: 500;
  }
  .kds-summary__right { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .kds-conn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    min-height: ${kds.touchMin}px;
    border-radius: 6px;
    font-size: 0.72rem;
    font-weight: 600;
    color: ${kds.ink};
    background: ${kds.surfaceElevated};
    border: 1px solid ${kds.hairline};
  }
  .kds-conn__dot { width: 7px; height: 7px; border-radius: 50%; background: ${kds.faint}; }
  .kds-conn--live .kds-conn__dot { background: ${kds.success}; }
  .kds-conn--poll .kds-conn__dot { background: ${kds.warning}; }
  .kds-conn__sync { color: ${kds.muted}; font-weight: 500; }
  .kds-clock {
    font-size: 1.15rem;
    font-weight: 650;
    font-variant-numeric: tabular-nums;
    color: ${kds.ink};
    padding: 0 8px;
    min-height: ${kds.touchMin}px;
    display: inline-flex;
    align-items: center;
  }
  .kds-ctrl-btn {
    background: transparent;
    border: 1px solid ${kds.hairline};
    border-radius: 6px;
    padding: 10px 12px;
    color: ${kds.ink};
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
    font-family: ${kds.font};
  }
  .kds-ctrl-btn:hover { background: ${kds.surfaceElevated}; }
  .kds-ctrl-btn:active { transform: scale(0.98); }

  .kds-action-error {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 18px;
    background: ${kds.error}22;
    border-bottom: 1px solid ${kds.error};
    color: ${kds.errorDark};
    font-weight: 600;
  }
  .kds-action-error__dismiss {
    min-height: ${kds.touchMin}px;
    padding: 8px 14px;
    border: none;
    border-radius: 6px;
    background: ${kds.error};
    color: #fff;
    font-weight: 700;
    cursor: pointer;
    font-family: ${kds.font};
  }

  .kds-board {
    background: ${kds.surface};
    padding: 12px 14px 28px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-height: calc(100vh - 140px);
  }
  .kds-board-empty {
    text-align: center;
    padding: 14px;
    border: 1px dashed ${kds.hairline};
    color: ${kds.muted};
    border-radius: 6px;
  }
  .kds-cook-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(180px, 1fr));
    gap: 0;
    align-items: stretch;
    min-height: 440px;
    background: ${kds.rail};
    border: 1px solid ${kds.hairline};
    border-radius: 8px;
    overflow: hidden;
  }
  .kds-handoff { padding-top: 4px; }
  .kds-handoff__label {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${kds.faint};
    margin-bottom: 8px;
  }
  .kds-handoff-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(150px, 1fr));
    gap: 0;
    min-height: 140px;
    border: 1px solid ${kds.hairline};
    border-radius: 8px;
    overflow: hidden;
    background: ${kds.rail};
  }

  .kds-col {
    background: ${kds.surfaceAlt};
    padding: 10px 8px 12px;
    border-right: 1px solid ${kds.hairline};
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }
  .kds-col:last-child { border-right: none; }
  .kds-col--compact { padding: 8px; }
  .kds-col__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 2px solid transparent;
    gap: 8px;
  }
  .kds-col__title-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .kds-col__dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .kds-col__title {
    margin: 0;
    font-size: 0.78rem;
    font-weight: 700;
    color: ${kds.ink};
    letter-spacing: 0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .kds-col--compact .kds-col__title { font-size: 0.72rem; }
  .kds-col__count {
    color: ${kds.muted};
    min-width: 22px;
    font-size: 0.85rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
  .kds-col__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    overflow-y: auto;
    min-height: 80px;
    max-height: calc(100vh - 280px);
    scrollbar-width: thin;
  }
  .kds-col--compact .kds-col__list { max-height: 200px; }
  .kds-col-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 28px 8px;
    color: ${kds.faint};
  }
  .kds-col-empty__text { font-size: 0.8rem; font-weight: 500; }

  .kds-ticket {
    background: ${kds.surfaceElevated};
    border-radius: 6px;
    padding: 12px;
    border: 1px solid ${kds.hairline};
    border-left: 3px solid ${kds.success};
  }
  .kds-ticket--urgent { outline: 1px solid ${kds.error}; }
  .kds-ticket--stale { opacity: 0.55; }
  .kds-ticket__head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 6px;
  }
  .kds-ticket__number {
    font-size: 1.2rem;
    font-weight: 750;
    color: ${kds.ink};
    letter-spacing: -0.03em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 70%;
  }
  .kds-elapsed {
    font-size: 1.05rem;
    font-weight: 750;
    font-variant-numeric: tabular-nums;
  }
  .kds-ticket__customer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .kds-ticket__name { font-weight: 600; font-size: 0.88rem; color: ${kds.ink}; }
  .kds-type {
    font-size: 0.62rem;
    font-weight: 700;
    padding: 3px 7px;
    border-radius: 4px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${kds.muted};
    border: 1px solid ${kds.hairline};
  }
  .kds-type--delivery { color: ${kds.infoDark}; }
  .kds-type--collection, .kds-type--dine_in { color: ${kds.successDark}; }
  .kds-urgent-badge {
    display: inline-block;
    background: ${kds.error};
    color: #fff;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 0.65rem;
    font-weight: 800;
    margin-bottom: 8px;
  }
  .kds-ticket__agg {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 0.62rem;
    font-weight: 800;
    margin-bottom: 8px;
  }
  .kds-ticket__notes {
    margin: 0 0 8px;
    padding: 6px 8px;
    background: ${kds.warning}18;
    border-left: 2px solid ${kds.warning};
    font-size: 0.8rem;
    font-weight: 600;
    color: ${kds.ink};
  }
  .kds-ticket__items { list-style: none; margin: 0 0 8px; padding: 0; }
  .kds-item {
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid ${kds.hairline};
  }
  .kds-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  .kds-item__row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .kds-item__qty {
    color: ${kds.ink};
    font-size: 0.9rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    min-width: 18px;
  }
  .kds-item__name { font-weight: 650; font-size: 0.92rem; color: ${kds.ink}; flex: 1; min-width: 0; }
  .kds-item__size { color: ${kds.muted}; font-size: 0.72rem; font-weight: 600; }
  .kds-item__mods { color: ${kds.muted}; font-size: 0.75rem; margin: 3px 0 0 26px; }
  .kds-item__allergens { margin-top: 4px; margin-left: 26px; }
  .kds-recipe-btn {
    margin-left: auto;
    width: 28px;
    height: 28px;
    min-width: 28px;
    border-radius: 50%;
    border: 1px solid ${kds.faint};
    background: transparent;
    color: ${kds.muted};
    font-size: 0.72rem;
    font-weight: 700;
    font-style: italic;
    cursor: pointer;
    font-family: ${kds.font};
  }
  .kds-oven {
    padding: 6px 0;
    margin-bottom: 6px;
    color: ${kds.warningDark};
    font-weight: 700;
    font-size: 0.8rem;
  }
  .kds-ticket__foot { display: flex; gap: 8px; margin-top: 8px; }
  .kds-next-btn, .kds-complete-btn {
    flex: 1;
    min-height: ${kds.touchMin}px;
    border: none;
    border-radius: 6px;
    background: ${kds.ink};
    color: ${kds.surface};
    font-weight: 800;
    font-size: 0.88rem;
    cursor: pointer;
    font-family: ${kds.font};
  }
  .kds-complete-btn { background: ${kds.success}; color: #fff; }
  .kds-next-btn:disabled, .kds-complete-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .kds-next-btn:active:not(:disabled), .kds-complete-btn:active:not(:disabled) { transform: scale(0.98); }

  .kds-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
    gap: 8px;
    min-height: 280px;
  }
  .kds-state--error { color: ${kds.errorDark}; }
  .kds-state__title { margin: 0; font-size: 1.1rem; font-weight: 750; }
  .kds-state__msg { margin: 0; font-size: 0.9rem; color: ${kds.muted}; max-width: 420px; }
  .kds-skeleton {
    width: 48px; height: 48px; border-radius: 8px;
    background: linear-gradient(90deg, ${kds.surfaceAlt}, ${kds.surfaceElevated}, ${kds.surfaceAlt});
    background-size: 200% 100%;
    animation: kdsShimmer 1.2s ease-in-out infinite;
  }
  @keyframes kdsShimmer {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }
  .kds-retry-btn { margin-top: 12px; }

  @media (max-width: 1200px) {
    .kds-cook-grid { grid-template-columns: repeat(3, minmax(160px, 1fr)); }
    .kds-handoff-grid { grid-template-columns: repeat(2, minmax(140px, 1fr)); }
    .kds-col { border-bottom: 1px solid ${kds.hairline}; }
  }
  @media (max-width: 800px) {
    .kds-cook-grid { grid-template-columns: 1fr 1fr; }
    .kds-handoff-grid { grid-template-columns: 1fr 1fr; }
    .kds-summary { flex-direction: column; align-items: stretch; }
  }
  @media (max-width: 520px) {
    .kds-cook-grid, .kds-handoff-grid { grid-template-columns: 1fr; }
  }
`;

export default KitchenDisplayPage;
