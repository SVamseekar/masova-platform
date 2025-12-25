import React from 'react';
import { PageStoreProvider } from '../contexts/PageStoreContext';

/**
 * Higher-Order Component that wraps a page component with PageStoreProvider
 * @param Component - The page component to wrap
 * @param contextKey - Unique key for this page's store context
 */
export function withPageStoreContext<P extends object>(
  Component: React.ComponentType<P>,
  contextKey: string
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <PageStoreProvider contextKey={contextKey}>
        <Component {...props} />
      </PageStoreProvider>
    );
  };

  WrappedComponent.displayName = `withPageStoreContext(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}
