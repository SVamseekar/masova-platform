import React, { createContext, useContext, useState } from 'react';

const TabsContext = createContext<{ value: string; onChange: (value: string) => void } | null>(null);

export const Tabs = ({
  children,
  defaultValue,
  className = ''
}: {
  children: React.ReactNode;
  defaultValue: string;
  className?: string
}) => {
  const [value, setValue] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ value, onChange: setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex border-b ${className}`}>
    {children}
  </div>
);

export const TabsTrigger = ({
  children,
  value,
  className = ''
}: {
  children: React.ReactNode;
  value: string;
  className?: string
}) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.value === value;

  return (
    <button
      onClick={() => context.onChange(value)}
      className={`px-4 py-2 ${isActive ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'} ${className}`}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({
  children,
  value,
  className = ''
}: {
  children: React.ReactNode;
  value: string;
  className?: string
}) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.value !== value) return null;

  return <div className={className}>{children}</div>;
};
