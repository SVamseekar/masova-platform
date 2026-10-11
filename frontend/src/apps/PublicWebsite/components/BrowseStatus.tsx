import type { useBrowseMenu } from './useBrowseMenu';

export default function BrowseStatus({ browse }: { browse: ReturnType<typeof useBrowseMenu> }) {
  if (browse.stores.isLoading) return <p role="status">Loading stores…</p>;
  if (browse.stores.isError) return <div role="alert"><p>Stores could not be loaded.</p><button type="button" onClick={() => browse.stores.refetch()}>Retry stores</button></div>;
  if (!browse.selectedStore) return <p role="status">Choose a store to see its menu.</p>;
  if (!browse.storeReady) return <p role="alert">This store is unavailable for ordering. Choose another store.</p>;
  if (!browse.canOrder) return <p role="status">This store is not accepting online orders. You can still browse its menu.</p>;
  if (browse.menu.isLoading || browse.menu.isFetching) return <p role="status">Loading menu…</p>;
  if (browse.menu.isError) return <div role="alert"><p>The menu could not be loaded.</p><button type="button" onClick={() => browse.menu.refetch()}>Retry menu</button></div>;
  if (!browse.online) return <p role="status">You’re offline. Cached dishes are shown for browsing; reconnect before adding items.</p>;
  return null;
}
