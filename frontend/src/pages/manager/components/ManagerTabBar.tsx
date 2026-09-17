import React from 'react';
import { t, tabStyle } from '../manager-tokens';

export interface ManagerTabItem {
  id: string;
  label: string;
}

export interface ManagerTabBarProps {
  tabs: readonly ManagerTabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  /** Optional aria label for the tablist (defaults to "Section tabs"). */
  ariaLabel?: string;
}

/**
 * Single shared tab bar for manager shell sections (Orders / Inventory / …).
 * Pill container + manager-tokens — matches Dashboard/Orders chrome.
 */
export const ManagerTabBar: React.FC<ManagerTabBarProps> = ({
  tabs,
  activeTab,
  onChange,
  ariaLabel = 'Section tabs',
}) => (
  <div
    role="tablist"
    aria-label={ariaLabel}
    data-testid="manager-tab-bar"
    style={{
      display: 'flex',
      gap: 6,
      marginBottom: 0,
      background: t.bgMain,
      padding: 6,
      borderRadius: t.radius.md,
      width: 'fit-content',
      maxWidth: '100%',
      flexWrap: 'wrap',
      boxSizing: 'border-box',
    }}
  >
    {tabs.map((tab) => {
      const selected = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={selected}
          data-testid={`manager-tab-${tab.id}`}
          data-active={selected ? 'true' : 'false'}
          onClick={() => onChange(tab.id)}
          style={tabStyle(selected)}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);

export default ManagerTabBar;
