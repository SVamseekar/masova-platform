// src/apps/POSSystem/POSDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  selectSelectedStoreId,
  selectSelectedStoreName,
  setSelectedStore,
  setStoreCurrency,
  selectCartCurrency,
  selectCartLocale,
  selectStoreCountryCode,
  selectDeliveryFeeINR,
  selectStoreMarketSynced,
} from '../../store/slices/cartSlice';
import { apiPriceToCartMajor } from '../../utils/currency';
import { storeCurrencyPayload, resolveStoreMarket } from '../../utils/storeCurrency';
import { computePreCheckoutTotals } from '../../utils/orderTax';
import { useGetStoreQuery, useGetActiveStoresQuery } from '../../store/api/storeApi';
import { usePosMarket } from './usePosMarket';
import MenuPanel from './components/MenuPanel';
import OrderPanel from './components/OrderPanel';
import CustomerPanel from './components/CustomerPanel';

import ClockInModal from './components/ClockInModal';
import ClockOutModal from './components/ClockOutModal';
import { PINAuthModal } from './components/PINAuthModal';
import OrderHistory from './OrderHistory';
import type { MenuItem } from '../../store/api/menuApi';
import type { POSCustomer, POSOrderItem } from './types';
import { useGetActiveStoreSessionsQuery } from '../../store/api/sessionApi';
import { useSnackbar } from 'notistack';
import { pos, posPanelShell, posTouchBtnBase, posAmbientRoot, posTouchBtnPrimary } from './posTokens';
import { POS_TABS, type PosTab, resolvePosDeliveryFee } from './posHelpers';
import PosReportsPanel from './PosReportsPanel';

/**
 * POS Dashboard — dense cashier board for live shifts (F2e).
 * Orders | History | Reports; dark-premium tokens + warm orange accent.
 */
const POSDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const currency = useAppSelector(selectCartCurrency);
  const locale = useAppSelector(selectCartLocale);
  const cartDeliveryFee = useAppSelector(selectDeliveryFeeINR);
  const storeCountryCode = useAppSelector(selectStoreCountryCode);
  const { marketReady, fmt, fmtOrder } = usePosMarket();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);
  const { enqueueSnackbar } = useSnackbar();

  const selectedStoreId = useAppSelector(selectSelectedStoreId);
  const selectedStoreName = useAppSelector(selectSelectedStoreName);
  const storeMarketSynced = useAppSelector(selectStoreMarketSynced);

  const isManager = user?.type === 'MANAGER';

  const urlStoreId = searchParams.get('storeId');
  // Prefer explicit store; never invent one — resolve from URL → cart → staff JWT → store list
  const storeId = urlStoreId || selectedStoreId || user?.storeId || undefined;

  const { data: storeProfile } = useGetStoreQuery(storeId ?? '', {
    skip: !storeId,
  });

  const { data: activeStores = [], isLoading: storesListLoading } = useGetActiveStoresQuery(undefined, {
    skip: Boolean(storeId),
  });

  // Bootstrap store selection from staff JWT or single active store (seed often has DOM001 only)
  useEffect(() => {
    if (storeId) return;
    if (user?.storeId) {
      dispatch(
        setSelectedStore({
          storeId: user.storeId,
          storeName: selectedStoreName || user.storeId,
        })
      );
      return;
    }
    if (storesListLoading || !activeStores.length) return;
    // Only auto-bind when there is exactly one active store (typical single-site seed)
    const open = activeStores.filter((s) => s.status === 'ACTIVE' || !s.status);
    if (open.length !== 1) return;
    dispatch(
      setSelectedStore({
        storeId: open[0].storeCode || open[0].id,
        storeName: open[0].name,
      })
    );
  }, [storeId, user, activeStores, storesListLoading, selectedStoreName, dispatch]);

  useEffect(() => {
    if (urlStoreId && urlStoreId !== selectedStoreId) {
      dispatch(setSelectedStore({ storeId: urlStoreId, storeName: selectedStoreName || urlStoreId }));
    }
  }, [urlStoreId, selectedStoreId, selectedStoreName, dispatch]);

  // Hydrate currency / locale / country only from store API record (no hard-coded market)
  useEffect(() => {
    if (!storeProfile || !storeId) return;
    const market = resolveStoreMarket(storeProfile);
    const canonical = storeProfile.storeCode || storeId;
    dispatch(setSelectedStore({ storeId: canonical, storeName: storeProfile.name }));
    if (market.resolved) {
      dispatch(setStoreCurrency(storeCurrencyPayload(storeProfile)));
    }
  }, [storeProfile, storeId, dispatch]);

  const storeMarketReady =
    Boolean(storeId && storeProfile && storeMarketSynced && resolveStoreMarket(storeProfile).resolved);

  const [activeTab, setActiveTab] = useState<PosTab>('orders');
  const [clockInModalOpen, setClockInModalOpen] = useState(false);
  const [clockOutModalOpen, setClockOutModalOpen] = useState(false);
  const [showPINModal, setShowPINModal] = useState(false);
  const [orderUser, setOrderUser] = useState<{
    userId: string;
    name: string;
    type: string;
    role: string;
    storeId: string;
  } | null>(null);

  const [orderItems, setOrderItems] = useState<POSOrderItem[]>([]);
  const [customer, setCustomer] = useState<POSCustomer | null>(null);
  const [orderType, setOrderType] = useState<'PICKUP' | 'DELIVERY' | 'DINE_IN'>('PICKUP');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const submitOrderRef = React.useRef<(() => void) | null>(null);

  const { data: activeSessions = [] } = useGetActiveStoreSessionsQuery(storeId || '', {
    skip: !storeId || !isManager,
  });

  const handleNewOrder = useCallback(() => {
    setOrderItems([]);
    setCustomer(null);
    setSelectedTable(null);
    setOrderUser(null);

    if (!user) {
      setShowPINModal(true);
    } else {
      setOrderUser({
        userId: user.id,
        name: user.name,
        type: user.type,
        role: user.role || 'Staff',
        storeId: user.storeId || storeId || '',
      });
      enqueueSnackbar(`Order started by ${user.name}`, { variant: 'success' });
    }
  }, [user, storeId, enqueueSnackbar]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('orders');
      }
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('history');
      }
      if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('reports');
      }
      if (e.key === 'Escape' && activeTab === 'orders') {
        e.preventDefault();
        handleNewOrder();
      }
      if (e.key === 'Enter' && e.ctrlKey && activeTab === 'orders') {
        e.preventDefault();
        submitOrderRef.current?.();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeTab, handleNewOrder]);

  const handleAddItem = (item: MenuItem, quantity: number = 1, instructions?: string) => {
    const existingIndex = orderItems.findIndex((orderItem) => orderItem.menuItemId === item.id);

    if (existingIndex >= 0 && !instructions) {
      const updatedItems = [...orderItems];
      updatedItems[existingIndex].quantity += quantity;
      setOrderItems(updatedItems);
    } else {
      setOrderItems([
        ...orderItems,
        {
          menuItemId: item.id,
          name: item.name,
          price: apiPriceToCartMajor(item.basePrice, currency),
          quantity,
          specialInstructions: instructions || '',
          image: item.imageUrl,
          allergens: item.allergens ?? [],
        },
      ]);
    }
  };

  const handleRemoveItem = (menuItemId: string) => {
    setOrderItems(orderItems.filter((item) => item.menuItemId !== menuItemId));
  };

  const handleUpdateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(menuItemId);
    } else {
      setOrderItems(
        orderItems.map((item) =>
          item.menuItemId === menuItemId ? { ...item, quantity } : item
        )
      );
    }
  };

  const handleUpdateInstructions = (menuItemId: string, instructions: string) => {
    setOrderItems(
      orderItems.map((item) =>
        item.menuItemId === menuItemId ? { ...item, specialInstructions: instructions } : item
      )
    );
  };

  const handlePINAuthenticated = (userData: {
    userId: string;
    name: string;
    type: string;
    role: string;
    storeId: string;
  }) => {
    setOrderUser(userData);
    setShowPINModal(false);
    enqueueSnackbar(`Order started by ${userData.name}`, { variant: 'success' });
  };

  const handleOrderComplete = () => {
    setOrderItems([]);
    setCustomer(null);
    setSelectedTable(null);
    setOrderUser(null);
    enqueueSnackbar('Order completed successfully!', { variant: 'success' });
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = resolvePosDeliveryFee(orderType, subtotal, cartDeliveryFee);
  const { total: orderTotal } = computePreCheckoutTotals(subtotal, deliveryFee, storeCountryCode);

  const hour = new Date().getHours();
  const dayPart =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const staffName = orderUser?.name || user?.name || 'Cashier';

  return (
    <div data-testid="pos-root" style={posAmbientRoot}>
      <style>{`
        @keyframes posPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        @media (max-width: 1100px) {
          [data-testid="pos-orders-board"] > div {
            flex-direction: column !important;
          }
          [data-testid="pos-menu-column"],
          [data-testid="pos-cart-column"],
          [data-testid="pos-pay-column"] {
            flex: 1 1 auto !important;
            min-height: 320px !important;
          }
        }
      `}</style>

      {/* Stable 3-column header — tabs never shift when Orders/History/Reports content changes */}
      <header
        data-testid="pos-header"
        style={{
          minHeight: 72,
          background: pos.headerBg,
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${pos.border}`,
          display: 'grid',
          gridTemplateColumns: 'minmax(200px, 1fr) auto minmax(200px, 1fr)',
          alignItems: 'center',
          columnGap: 16,
          padding: '10px 20px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: `linear-gradient(145deg, ${pos.role}, ${pos.roleDark})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 15,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            M
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: pos.headerMuted,
              }}
            >
              MaSoVa <span style={{ color: pos.role }}>POS</span>
            </div>
            <div
              data-testid="pos-store-label"
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: pos.ink,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {selectedStoreName || storeId || 'Point of Sale'}
            </div>
            <div style={{ fontSize: 12, color: pos.muted, marginTop: 1 }}>
              {dayPart}
              {orderUser || user ? ` · ${staffName.split(' ')[0]}` : ''}
              {storeMarketReady && storeCountryCode ? ` · ${storeCountryCode}` : ''}
              {storeMarketReady && currency ? ` · ${currency}` : ''}
              {!storeMarketReady && storeId ? ' · …' : ''}
            </div>
          </div>
        </div>

        <nav
          data-testid="pos-tab-bar"
          style={{
            display: 'flex',
            gap: 4,
            background: 'rgba(255,255,255,0.04)',
            padding: 5,
            borderRadius: 999,
            border: `1px solid ${pos.border}`,
            justifySelf: 'center',
          }}
          aria-label="POS sections"
        >
          {POS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              data-testid={`pos-tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...posTouchBtnBase,
                minHeight: 42,
                minWidth: 96,
                padding: '8px 16px',
                borderRadius: 999,
                fontSize: 13,
                gap: 6,
                ...(activeTab === tab.key
                  ? {
                      background: `linear-gradient(135deg, ${pos.role} 0%, ${pos.roleDark} 100%)`,
                      color: '#ffffff',
                      boxShadow: `0 4px 16px ${pos.roleShadow}`,
                    }
                  : {
                      background: 'transparent',
                      color: pos.headerMuted,
                    }),
              }}
            >
              {tab.label}
              <span
                style={{
                  fontSize: 10,
                  opacity: activeTab === tab.key ? 0.9 : 0.55,
                  fontWeight: 600,
                  fontFamily: pos.mono,
                }}
              >
                {tab.shortcut}
              </span>
            </button>
          ))}
        </nav>

        {/* Right cluster: fixed min width so tabs stay centered across tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            flexWrap: 'wrap',
            minHeight: 48,
            minWidth: 0,
          }}
        >
          {orderUser ? (
            <div
              data-testid="pos-order-user"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 14px',
                background: 'rgba(16,185,129,0.12)',
                borderRadius: 999,
                border: `1px solid ${pos.success}66`,
                minHeight: 44,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: pos.success,
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: 9,
                    color: pos.headerMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: 700,
                  }}
                >
                  Serving
                </div>
                <div style={{ fontSize: 13, color: pos.successDark, fontWeight: 800 }}>
                  {orderUser.name}
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleNewOrder}
              style={{
                ...posTouchBtnPrimary,
                minHeight: 44,
                visibility: activeTab === 'orders' ? 'visible' : 'hidden',
                pointerEvents: activeTab === 'orders' ? 'auto' : 'none',
              }}
            >
              New order
            </button>
          )}

          <div
            data-testid="pos-cart-total"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'center',
              padding: '6px 14px',
              background:
                activeTab === 'orders' && orderItems.length > 0
                  ? pos.roleSoft
                  : 'transparent',
              border:
                activeTab === 'orders' && orderItems.length > 0
                  ? `1px solid ${pos.roleBorder}`
                  : '1px solid transparent',
              borderRadius: 14,
              minHeight: 44,
              minWidth: 88,
              opacity: activeTab === 'orders' && orderItems.length > 0 ? 1 : 0,
              pointerEvents: 'none',
            }}
            aria-hidden={!(activeTab === 'orders' && orderItems.length > 0)}
          >
            <span
              style={{
                fontSize: 9,
                color: pos.headerMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 700,
              }}
            >
              Total
            </span>
            <span style={{ fontSize: 18, fontWeight: 900, color: pos.role, lineHeight: 1.1 }}>
              {fmt(orderTotal)}
            </span>
          </div>

          {isManager && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setClockInModalOpen(true)}
                style={{
                  ...posTouchBtnBase,
                  borderRadius: 999,
                  background: pos.successSoft,
                  color: pos.successDark,
                  border: `1px solid ${pos.success}`,
                }}
              >
                Clock In
              </button>
              <button
                type="button"
                onClick={() => setClockOutModalOpen(true)}
                disabled={activeSessions.length === 0}
                style={{
                  ...posTouchBtnBase,
                  borderRadius: 999,
                  background: activeSessions.length === 0 ? pos.surfaceElevated : pos.errorSoft,
                  color: activeSessions.length === 0 ? pos.faint : pos.errorDark,
                  border: `1px solid ${activeSessions.length === 0 ? pos.border : pos.error}`,
                  opacity: activeSessions.length === 0 ? 0.5 : 1,
                  cursor: activeSessions.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Clock Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ORDERS — landscape craft board: menu ~42% · cart ~28% · pay ~30% */}
      {activeTab === 'orders' && (
        <div
          data-testid="pos-orders-board"
          style={{
            flex: 1,
            overflow: 'hidden',
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 14,
              flex: 1,
              minHeight: 0,
            }}
          >
            <div style={{ ...posPanelShell, flex: '4.2 1 0' }} data-testid="pos-menu-column">
              <MenuPanel onAddItem={handleAddItem} />
            </div>
            <div style={{ ...posPanelShell, flex: '2.8 1 0' }} data-testid="pos-cart-column">
              <OrderPanel
                items={orderItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onUpdateInstructions={handleUpdateInstructions}
                onNewOrder={handleNewOrder}
                orderType={orderType}
                onOrderTypeChange={setOrderType}
                selectedTable={selectedTable}
                onTableSelect={setSelectedTable}
              />
            </div>
            <div style={{ ...posPanelShell, flex: '3 1 0' }} data-testid="pos-pay-column">
              <CustomerPanel
                items={orderItems}
                customer={customer}
                onCustomerChange={setCustomer}
                orderType={orderType}
                selectedTable={selectedTable}
                onOrderComplete={handleOrderComplete}
                userId={user?.id || orderUser?.userId}
                storeId={storeId}
                submitOrderRef={submitOrderRef}
                orderCreatedBy={orderUser}
              />
            </div>
          </div>
        </div>
      )}

      {/* HISTORY */}
      {activeTab === 'history' && (
        <div
          data-testid="pos-history-panel"
          style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}
        >
          <OrderHistory embedded storeIdOverride={storeId || undefined} />
        </div>
      )}

      {/* REPORTS */}
      {activeTab === 'reports' && (
        <div
          data-testid="pos-reports-panel"
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 16,
            backgroundColor: pos.surfaceBg,
          }}
        >
          <PosReportsPanel
            storeId={storeId}
            isManager={isManager}
            marketReady={marketReady}
            locale={locale}
            storeCountryCode={storeCountryCode}
            fmt={fmt}
            fmtOrder={fmtOrder}
            onClockIn={() => setClockInModalOpen(true)}
          />
        </div>
      )}

      {storeId && (
        <ClockInModal
          isOpen={clockInModalOpen}
          onClose={() => setClockInModalOpen(false)}
          storeId={storeId}
        />
      )}
      {storeId && (
        <ClockOutModal
          isOpen={clockOutModalOpen}
          onClose={() => setClockOutModalOpen(false)}
          storeId={storeId}
        />
      )}
      <PINAuthModal
        isOpen={showPINModal}
        onClose={() => setShowPINModal(false)}
        onAuthenticated={handlePINAuthenticated}
      />
    </div>
  );
};

export default POSDashboard;
