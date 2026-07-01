import React, { useRef, useState, useMemo } from 'react';
import { Box } from '@mui/material';
import { calculateVisibleRange, throttle } from '../../utils/performance';

/**
 * Virtual List Component for efficient rendering of large lists
 * Phase 13: Performance Optimization - Virtual scrolling
 */

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  onScrollEnd?: () => void;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
  renderItem,
  onScrollEnd,
}: VirtualListProps<T>): React.ReactElement {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { start, end } = calculateVisibleRange(
    scrollTop,
    containerHeight,
    itemHeight,
    items.length,
    overscan
  );

  const visibleItems = items.slice(start, end);
  const totalHeight = items.length * itemHeight;
  const offsetY = start * itemHeight;

  const handleScroll = useMemo(() => {
    const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      setScrollTop(target.scrollTop);

      if (onScrollEnd) {
        const isAtBottom =
          target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
        if (isAtBottom) {
          onScrollEnd();
        }
      }
    };
    return throttle(onScroll as (...args: unknown[]) => unknown, 16) as typeof onScroll;
  }, [onScrollEnd]);

  return (
    <Box
      ref={containerRef}
      sx={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      <Box
        sx={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            transform: `translateY(${offsetY}px)`,
            willChange: 'transform',
          }}
        >
          {visibleItems.map((item, index) => (
            <Box
              key={start + index}
              sx={{
                height: itemHeight,
                overflow: 'hidden',
              }}
            >
              {renderItem(item, start + index)}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
