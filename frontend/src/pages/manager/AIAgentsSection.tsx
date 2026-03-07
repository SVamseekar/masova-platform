import React, { useState } from 'react';
import { t, cardStyle, sectionTitleStyle } from './manager-tokens';
import {
  useGetHealthQuery,
  useTriggerDemandForecastMutation,
  useTriggerInventoryReorderMutation,
  useTriggerChurnPreventionMutation,
  useTriggerShiftOptimisationMutation,
  useTriggerKitchenCoachMutation,
  useTriggerDynamicPricingMutation,
} from '../../store/api/agentApi';

interface Props {
  storeId: string;
}

/* ── SVG Icon components (inline, no emoji) ─────────────────────────────── */

const IconChat = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconTrending = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IconPackage = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const IconTarget = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);

const IconStar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconChef = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6z" />
    <line x1="6" y1="17" x2="18" y2="17" />
  </svg>
);

const IconDollar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconSparkle = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
    <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
  </svg>
);

const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconPlay = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const IconBell = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconClipboard = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

/* ── Agent Definitions ───────────────────────────────────────────────────── */

interface AgentDef {
  id: string;
  name: string;
  shortName: string;
  description: string;
  schedule: string;
  icon: React.FC;
  color: string;
  status: 'active' | 'stub' | 'event-driven';
  category: 'intelligence' | 'operations' | 'engagement';
}

const agents: AgentDef[] = [
  {
    id: 'support-chat',
    name: 'Customer Support',
    shortName: 'Agent 1',
    description: 'AI chat assistant that handles order status, menu enquiries, complaints, refunds, and loyalty points. Available around the clock via the chat widget.',
    schedule: 'Always on',
    icon: IconChat,
    color: t.blue,
    status: 'active',
    category: 'engagement',
  },
  {
    id: 'demand-forecast',
    name: 'Demand Forecasting',
    shortName: 'Agent 2',
    description: 'Analyses 90 days of order history to predict tomorrow\'s demand per menu item, per hour-slot. Helps you prep the right quantities and reduce waste.',
    schedule: 'Nightly at 2:00 AM',
    icon: IconTrending,
    color: t.green,
    status: 'active',
    category: 'intelligence',
  },
  {
    id: 'inventory-reorder',
    name: 'Inventory Reorder',
    shortName: 'Agent 3',
    description: 'Checks stock levels every 6 hours. When items run low, it drafts a purchase order for your preferred supplier and notifies you to review.',
    schedule: 'Every 6 hours',
    icon: IconPackage,
    color: '#8B5CF6',
    status: 'active',
    category: 'operations',
  },
  {
    id: 'churn-prevention',
    name: 'Churn Prevention',
    shortName: 'Agent 4',
    description: 'Identifies high-value customers who haven\'t ordered in 14+ days and drafts a personalised win-back campaign with a 15% discount offer.',
    schedule: 'Daily at 10:00 AM',
    icon: IconTarget,
    color: t.orange,
    status: 'active',
    category: 'engagement',
  },
  {
    id: 'review-response',
    name: 'Smart Review Response',
    shortName: 'Agent 5',
    description: 'When a customer leaves a rating of 3 stars or below, this agent uses AI to draft a personalised, empathetic response for you to review and send.',
    schedule: 'On new low review',
    icon: IconStar,
    color: t.yellow,
    status: 'event-driven',
    category: 'engagement',
  },
  {
    id: 'shift-optimisation',
    name: 'Shift Optimisation',
    shortName: 'Agent 6',
    description: 'Uses demand forecasts to draft next week\'s optimal shift schedule. Balances coverage with staff preferences and historical efficiency.',
    schedule: 'Sundays at 8:00 PM',
    icon: IconCalendar,
    color: '#EC4899',
    status: 'stub',
    category: 'operations',
  },
  {
    id: 'kitchen-coach',
    name: 'Kitchen Coach',
    shortName: 'Agent 7',
    description: 'Analyses daily kitchen metrics — prep times, throughput, peak performance — and generates coaching insights for your kitchen team.',
    schedule: 'Nightly at 11:00 PM',
    icon: IconChef,
    color: '#F97316',
    status: 'stub',
    category: 'operations',
  },
  {
    id: 'dynamic-pricing',
    name: 'Dynamic Pricing',
    shortName: 'Agent 8',
    description: 'Suggests price adjustments for slow-moving items based on real-time demand vs forecast. All suggestions are drafts — you approve before they go live.',
    schedule: 'Every 30 min (9 AM – 10 PM)',
    icon: IconDollar,
    color: '#14B8A6',
    status: 'stub',
    category: 'intelligence',
  },
];

const categoryLabels: Record<string, { label: string; description: string }> = {
  intelligence: { label: 'Intelligence', description: 'Forecast, analyse, and optimise' },
  operations: { label: 'Operations', description: 'Inventory, shifts, and kitchen' },
  engagement: { label: 'Engagement', description: 'Customers, reviews, and campaigns' },
};

const categoryOrder = ['intelligence', 'operations', 'engagement'];

/* ── Status Pill ─────────────────────────────────────────────────────────── */

const StatusPill: React.FC<{ status: AgentDef['status'] }> = ({ status }) => {
  const config = {
    active: { bg: '#D1FAE5', color: '#065F46', label: 'Active' },
    'event-driven': { bg: '#DBEAFE', color: '#1E40AF', label: 'Event-Driven' },
    stub: { bg: '#FEF3C7', color: '#92400E', label: 'Coming Soon' },
  }[status];
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: config.bg, color: config.color, letterSpacing: '0.01em',
    }}>
      {config.label}
    </span>
  );
};

/* ── Main Component ──────────────────────────────────────────────────────── */

const AIAgentsSection: React.FC<Props> = (_props) => {
  const { data: health, isLoading: healthLoading } = useGetHealthQuery(undefined, { pollingInterval: 30000 });
  const [triggerDemand, { isLoading: demandLoading }] = useTriggerDemandForecastMutation();
  const [triggerInventory, { isLoading: inventoryLoading }] = useTriggerInventoryReorderMutation();
  const [triggerChurn, { isLoading: churnLoading }] = useTriggerChurnPreventionMutation();
  const [triggerShift, { isLoading: shiftLoading }] = useTriggerShiftOptimisationMutation();
  const [triggerKitchen, { isLoading: kitchenLoading }] = useTriggerKitchenCoachMutation();
  const [triggerPricing, { isLoading: pricingLoading }] = useTriggerDynamicPricingMutation();

  const [lastResults, setLastResults] = useState<Record<string, string>>({});

  const triggerMap: Record<string, { trigger: () => void; loading: boolean }> = {
    'demand-forecast': {
      trigger: () => triggerDemand().unwrap()
        .then(r => setLastResults(prev => ({ ...prev, 'demand-forecast': JSON.stringify(r, null, 2) })))
        .catch(() => setLastResults(prev => ({ ...prev, 'demand-forecast': 'Agent service unavailable' }))),
      loading: demandLoading,
    },
    'inventory-reorder': {
      trigger: () => triggerInventory().unwrap()
        .then(r => setLastResults(prev => ({ ...prev, 'inventory-reorder': JSON.stringify(r, null, 2) })))
        .catch(() => setLastResults(prev => ({ ...prev, 'inventory-reorder': 'Agent service unavailable' }))),
      loading: inventoryLoading,
    },
    'churn-prevention': {
      trigger: () => triggerChurn().unwrap()
        .then(r => setLastResults(prev => ({ ...prev, 'churn-prevention': JSON.stringify(r, null, 2) })))
        .catch(() => setLastResults(prev => ({ ...prev, 'churn-prevention': 'Agent service unavailable' }))),
      loading: churnLoading,
    },
    'shift-optimisation': {
      trigger: () => triggerShift().unwrap()
        .then(r => setLastResults(prev => ({ ...prev, 'shift-optimisation': JSON.stringify(r, null, 2) })))
        .catch(() => setLastResults(prev => ({ ...prev, 'shift-optimisation': 'Agent service unavailable' }))),
      loading: shiftLoading,
    },
    'kitchen-coach': {
      trigger: () => triggerKitchen().unwrap()
        .then(r => setLastResults(prev => ({ ...prev, 'kitchen-coach': JSON.stringify(r, null, 2) })))
        .catch(() => setLastResults(prev => ({ ...prev, 'kitchen-coach': 'Agent service unavailable' }))),
      loading: kitchenLoading,
    },
    'dynamic-pricing': {
      trigger: () => triggerPricing().unwrap()
        .then(r => setLastResults(prev => ({ ...prev, 'dynamic-pricing': JSON.stringify(r, null, 2) })))
        .catch(() => setLastResults(prev => ({ ...prev, 'dynamic-pricing': 'Agent service unavailable' }))),
      loading: pricingLoading,
    },
  };

  const isOnline = !!health?.status;

  return (
    <div>
      {/* Header banner */}
      <div style={{
        ...cardStyle,
        background: `linear-gradient(135deg, ${t.orange}12 0%, ${t.blue}08 50%, #8B5CF610 100%)`,
        border: `1px solid ${t.grayLight}`,
        marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: `linear-gradient(135deg, ${t.orange}, #8B5CF6)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
            boxShadow: `0 4px 16px ${t.orange}30`,
          }}>
            <IconSparkle />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: t.black }}>AI Agents</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: t.gray }}>
              8 intelligent agents working behind the scenes — forecasting demand, reordering stock, recovering customers, and more.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: healthLoading ? t.yellow : isOnline ? t.green : t.red,
            boxShadow: isOnline ? `0 0 8px ${t.green}60` : 'none',
          }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: isOnline ? t.green : t.red }}>
            {healthLoading ? 'Checking...' : isOnline ? 'Agent Service Online' : 'Agent Service Offline'}
          </span>
        </div>
      </div>

      {/* Agent categories */}
      {categoryOrder.map(cat => {
        const catAgents = agents.filter(a => a.category === cat);
        const catInfo = categoryLabels[cat];
        return (
          <div key={cat} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
              <h3 style={{ ...sectionTitleStyle, fontSize: 16 }}>{catInfo.label}</h3>
              <span style={{ fontSize: 12, color: t.grayMuted }}>{catInfo.description}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {catAgents.map(agent => {
                const tm = triggerMap[agent.id];
                const result = lastResults[agent.id];
                const AgentIcon = agent.icon;
                return (
                  <div key={agent.id} style={{
                    ...cardStyle,
                    border: `1px solid ${t.grayLight}`,
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    cursor: 'default',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 32px ${agent.color}18`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    {/* Accent strip */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                      background: `linear-gradient(90deg, ${agent.color}, ${agent.color}60)`,
                    }} />

                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: 12,
                          background: `${agent.color}14`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: agent.color,
                        }}>
                          <AgentIcon />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: t.black }}>{agent.name}</div>
                          <div style={{ fontSize: 11, color: t.grayMuted, fontWeight: 500 }}>{agent.shortName}</div>
                        </div>
                      </div>
                      <StatusPill status={agent.status} />
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: 13, color: t.gray, lineHeight: 1.6, margin: '0 0 14px' }}>
                      {agent.description}
                    </p>

                    {/* Schedule + trigger */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 0 0', borderTop: `1px solid ${t.grayLight}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: t.grayMuted }}>
                        <IconClock />
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{agent.schedule}</span>
                      </div>
                      {tm && (
                        <button
                          onClick={tm.trigger}
                          disabled={tm.loading || !isOnline}
                          style={{
                            padding: '6px 14px', borderRadius: 8, border: 'none',
                            background: tm.loading ? t.grayLight : `${agent.color}14`,
                            color: tm.loading ? t.grayMuted : agent.color,
                            fontSize: 12, fontWeight: 600, cursor: tm.loading || !isOnline ? 'not-allowed' : 'pointer',
                            fontFamily: t.font, transition: 'background 0.2s',
                            display: 'flex', alignItems: 'center', gap: 6,
                          }}
                        >
                          {tm.loading ? (
                            <>
                              <span style={{ display: 'inline-block', width: 12, height: 12, border: `2px solid ${t.grayMuted}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'agentSpin 0.8s linear infinite' }} />
                              Running...
                            </>
                          ) : (
                            <>
                              <IconPlay />
                              Run Now
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Result output */}
                    {result && (
                      <div style={{
                        marginTop: 10, padding: '8px 12px', borderRadius: 8,
                        background: `${agent.color}08`, border: `1px solid ${agent.color}20`,
                        fontSize: 11, fontFamily: 'monospace', color: t.gray,
                        maxHeight: 100, overflowY: 'auto', whiteSpace: 'pre-wrap',
                      }}>
                        {result}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* How it works section */}
      <div style={{
        ...cardStyle, marginTop: 8,
        border: `1px solid ${t.grayLight}`,
        background: `linear-gradient(135deg, #F0FDF4 0%, #EFF6FF 100%)`,
      }}>
        <h3 style={{ ...sectionTitleStyle, marginBottom: 14 }}>How AI Agents Work</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { Icon: IconRefresh, title: 'Automated Schedules', desc: 'Agents run on fixed schedules (nightly, hourly) with no manual intervention needed.', color: t.blue },
            { Icon: IconClipboard, title: 'Draft, Never Act', desc: 'Every agent creates drafts (POs, campaigns, responses). You review and approve before anything goes live.', color: t.green },
            { Icon: IconBell, title: 'Smart Notifications', desc: 'When an agent completes a task, you receive a notification with a summary and action link.', color: t.orange },
          ].map(item => (
            <div key={item.title} style={{ display: 'flex', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${item.color}12`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: item.color, flexShrink: 0,
              }}>
                <item.Icon />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.black, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: t.gray, lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes agentSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AIAgentsSection;
