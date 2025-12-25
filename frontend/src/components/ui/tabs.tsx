import React, { createContext, useContext, useState } from 'react';
import { colors, spacing, typography } from '../../styles/design-tokens';

const TabsContext = createContext<{ value: string; onChange: (value: string) => void } | null>(null);

export const Tabs = ({
  children,
  defaultValue,
  style,
  ...props
}: {
  children: React.ReactNode;
  defaultValue: string;
  style?: React.CSSProperties;
}) => {
  const [value, setValue] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ value, onChange: setValue }}>
      <div style={style} {...props}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, style, ...props }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    display: 'flex',
    borderBottom: `2px solid ${colors.surface.border}`,
    gap: spacing[2],
    ...style
  }} {...props}>
    {children}
  </div>
);

export const TabsTrigger = ({
  children,
  value,
  style,
  ...props
}: {
  children: React.ReactNode;
  value: string;
  style?: React.CSSProperties;
}) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.value === value;

  return (
    <button
      onClick={() => context.onChange(value)}
      style={{
        padding: `${spacing[2]} ${spacing[4]}`,
        background: 'none',
        border: 'none',
        borderBottom: isActive ? `2px solid ${colors.brand.primary}` : '2px solid transparent',
        color: isActive ? colors.brand.primary : colors.text.secondary,
        fontSize: typography.fontSize.sm,
        fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.medium,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ...style
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({
  children,
  value,
  style,
  ...props
}: {
  children: React.ReactNode;
  value: string;
  style?: React.CSSProperties;
}) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.value !== value) return null;

  return <div style={{ marginTop: spacing[4], ...style }} {...props}>{children}</div>;
};
