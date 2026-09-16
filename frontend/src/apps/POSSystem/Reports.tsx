import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectSelectedStoreId } from '../../store/slices/cartSlice';
import AppHeader from '../../components/common/AppHeader';
import { pos, posAmbientRoot, posTouchBtnBase } from './posTokens';
import { usePosMarket } from './usePosMarket';
import PosReportsPanel from './PosReportsPanel';
import {
  useGetAllInventoryItemsQuery,
  useGetLowStockItemsQuery,
} from '../../store/api/inventoryApi';
import { useGetStaffLeaderboardQuery } from '../../store/api/analyticsApi';

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const selectedStoreId = useAppSelector(selectSelectedStoreId);
  const { fmt, fmtOrder, marketReady, locale, storeCountryCode } = usePosMarket();
  const [activeTab, setActiveTab] = useState<'sales' | 'staff' | 'inventory'>('sales');
  const storeId = selectedStoreId || user?.storeId;

  const { data: staffData, isError: errorStaff } = useGetStaffLeaderboardQuery(
    { period: 'TODAY', storeId },
    { skip: !storeId || activeTab !== 'staff' }
  );
  const { data: inventory = [], isError: inventoryError } = useGetAllInventoryItemsQuery(storeId, {
    skip: !storeId || activeTab !== 'inventory',
  });
  const { data: lowStock = [] } = useGetLowStockItemsQuery(storeId, {
    skip: !storeId || activeTab !== 'inventory',
  });

  if (user?.type !== 'MANAGER') {
    return (
      <div style={{ ...posAmbientRoot, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <div
          style={{
            maxWidth: 420,
            textAlign: 'center',
            background: pos.surface,
            border: `1px solid ${pos.error}`,
            borderRadius: 12,
            padding: 28,
          }}
        >
          <h2 style={{ margin: '0 0 8px', color: pos.errorDark }}>Access Denied</h2>
          <p style={{ margin: '0 0 16px', color: pos.muted }}>This page is only accessible to managers.</p>
          <button
            type="button"
            onClick={() => navigate('/pos')}
            style={{ ...posTouchBtnBase, background: pos.role, color: '#fff' }}
          >
            ← Back to POS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={posAmbientRoot}>
      <AppHeader title={`Reports & Analytics - ${user?.name || 'Manager'}`} />
      <div
        style={{
          padding: '10px 20px',
          background: pos.headerBg,
          borderBottom: `1px solid ${pos.border}`,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/pos')}
          style={{ ...posTouchBtnBase, background: pos.surfaceElevated, color: pos.ink, border: `1px solid ${pos.border}` }}
        >
          ← Back to POS
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {(['sales', 'staff', 'inventory'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              style={{
                ...posTouchBtnBase,
                minHeight: 40,
                background: activeTab === key ? pos.role : 'transparent',
                color: activeTab === key ? '#fff' : pos.muted,
                border: `1px solid ${activeTab === key ? pos.role : pos.border}`,
                textTransform: 'capitalize',
              }}
            >
              {key === 'sales' ? 'Sales' : key === 'staff' ? 'Staff' : 'Inventory'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {activeTab === 'sales' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              data-testid="reports-sales-kpis"
              style={{ display: 'none' }}
              aria-hidden
            />
            <PosReportsPanel
              storeId={storeId}
              isManager
              marketReady={marketReady}
              locale={locale}
              storeCountryCode={storeCountryCode}
              fmt={fmt}
              fmtOrder={fmtOrder}
            />
            <button
              type="button"
              onClick={() => navigate('/manager?section=analytics&tab=reports')}
              style={{ ...posTouchBtnBase, background: pos.surfaceElevated, color: pos.ink, border: `1px solid ${pos.border}` }}
            >
              View Advanced Reports (Charts & Trends)
            </button>
            <button
              type="button"
              onClick={() => navigate('/manager?section=analytics&tab=products')}
              style={{ ...posTouchBtnBase, background: 'transparent', color: pos.muted, border: `1px solid ${pos.border}` }}
            >
              View Full Analytics →
            </button>
          </div>
        )}

        {activeTab === 'staff' && (
          <section
            style={{
              background: pos.surface,
              border: `1px solid ${pos.border}`,
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: pos.ink, fontSize: 15 }}>Staff Performance (Today)</h3>
              <button
                type="button"
                onClick={() => navigate('/manager?section=people&tab=leaderboard')}
                style={{ ...posTouchBtnBase, minHeight: 36, background: 'transparent', color: pos.muted, border: `1px solid ${pos.border}` }}
              >
                View Full Leaderboard →
              </button>
            </div>
            {errorStaff ? (
              <div style={{ color: pos.error }}>Failed to load staff leaderboard.</div>
            ) : staffData?.rankings?.length ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
                {staffData.rankings.slice(0, 8).map((staff, index) => (
                  <li
                    key={staff.staffId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: pos.surfaceElevated,
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ color: pos.ink, fontWeight: 650 }}>
                      #{index + 1} {staff.staffName}
                    </span>
                    <span style={{ color: pos.muted, fontSize: 13 }}>
                      {staff.ordersProcessed} orders processed · {fmt(staff.salesGenerated)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: pos.muted, padding: 24, textAlign: 'center' }}>
                No staff performance data available
              </div>
            )}
          </section>
        )}

        {activeTab === 'inventory' && (
          <section
            style={{
              background: pos.surface,
              border: `1px solid ${pos.border}`,
              borderRadius: 10,
              padding: 20,
            }}
          >
            <h3 style={{ margin: '0 0 8px', color: pos.ink }}>Inventory Management</h3>
            {inventoryError ? (
              <p style={{ color: pos.error }}>Inventory service unavailable.</p>
            ) : (
              <p style={{ color: pos.muted, marginTop: 0 }}>
                {inventory.length} items on file · {lowStock.length} low stock
              </p>
            )}
            {lowStock.slice(0, 8).map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${pos.border}`, color: pos.ink }}>
                <span>{item.itemName}</span>
                <span style={{ color: pos.warningDark }}>
                  {item.currentStock} {item.unit}
                </span>
              </div>
            ))}
            <button
              type="button"
              onClick={() => navigate('/manager/inventory')}
              style={{ ...posTouchBtnBase, marginTop: 16, background: pos.role, color: '#fff' }}
            >
              Go to Inventory Management
            </button>
          </section>
        )}
      </div>
    </div>
  );
};

export default Reports;
