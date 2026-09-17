/**
 * Shared AI agent catalog (status only) for AIAgentsSection + Quick Info.
 * Icons / full copy live in AIAgentsSection; this module is data-only.
 */
import type { AgentStatus, AgentStatusEntry } from './quickInfoMetrics';
import { countAgentStatuses } from './quickInfoMetrics';

export interface AgentCatalogEntry extends AgentStatusEntry {
  name: string;
  shortName: string;
  schedule: string;
  category: 'intelligence' | 'operations' | 'engagement';
}

export const AGENT_CATALOG: AgentCatalogEntry[] = [
  {
    id: 'support-chat',
    name: 'Customer Support',
    shortName: 'Agent 1',
    schedule: 'Always on',
    status: 'active',
    category: 'engagement',
  },
  {
    id: 'demand-forecast',
    name: 'Demand Forecasting',
    shortName: 'Agent 2',
    schedule: 'Nightly at 2:00 AM',
    status: 'active',
    category: 'intelligence',
  },
  {
    id: 'inventory-reorder',
    name: 'Inventory Reorder',
    shortName: 'Agent 3',
    schedule: 'Every 6 hours',
    status: 'active',
    category: 'operations',
  },
  {
    id: 'churn-prevention',
    name: 'Churn Prevention',
    shortName: 'Agent 4',
    schedule: 'Daily at 10:00 AM',
    status: 'active',
    category: 'engagement',
  },
  {
    id: 'review-response',
    name: 'Smart Review Response',
    shortName: 'Agent 5',
    schedule: 'On new low review',
    status: 'event-driven',
    category: 'engagement',
  },
  {
    id: 'shift-optimisation',
    name: 'Shift Optimisation',
    shortName: 'Agent 6',
    schedule: 'Sundays at 8:00 PM',
    status: 'stub',
    category: 'operations',
  },
  {
    id: 'kitchen-coach',
    name: 'Kitchen Coach',
    shortName: 'Agent 7',
    schedule: 'Nightly at 11:00 PM',
    status: 'stub',
    category: 'operations',
  },
  {
    id: 'dynamic-pricing',
    name: 'Dynamic Pricing',
    shortName: 'Agent 8',
    schedule: 'Every 30 min (9 AM – 10 PM)',
    status: 'stub',
    category: 'intelligence',
  },
];

export function getAgentStatusCounts() {
  return countAgentStatuses(AGENT_CATALOG);
}

export function getAgentStatus(id: string): AgentStatus | undefined {
  return AGENT_CATALOG.find((a) => a.id === id)?.status;
}
