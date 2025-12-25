/**
 * Performance optimization utilities for frontend
 * Phase 13: Performance Optimization - Frontend utilities
 */

/**
 * Debounce function to limit function execution rate
 * Use for search inputs, scroll events, resize events
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to ensure function is not called more than once in specified time
 * Use for scroll events, mouse move events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImage(imageElement: HTMLImageElement): void {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      }
    });
  });

  imageObserver.observe(imageElement);
}

/**
 * Measure component render time
 */
export function measureRenderTime(componentName: string, callback: () => void): void {
  const startTime = performance.now();
  callback();
  const endTime = performance.now();
  const renderTime = endTime - startTime;

  if (renderTime > 16) {
    // Warn if render takes more than one frame (16ms at 60fps)
    console.warn(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
  }
}

/**
 * Cache API responses in localStorage
 */
export const cacheStorage = {
  set: (key: string, data: any, ttl: number = 3600000): void => {
    const item = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(item));
  },

  get: (key: string): any | null => {
    const itemStr = localStorage.getItem(`cache_${key}`);
    if (!itemStr) return null;

    try {
      const item = JSON.parse(itemStr);
      const now = Date.now();

      if (now - item.timestamp > item.ttl) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return item.data;
    } catch {
      return null;
    }
  },

  remove: (key: string): void => {
    localStorage.removeItem(`cache_${key}`);
  },

  clear: (): void => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  },
};

/**
 * Optimize images by loading appropriate size based on device
 */
export function getOptimizedImageUrl(
  baseUrl: string,
  width: number,
  quality: number = 80
): string {
  const dpr = window.devicePixelRatio || 1;
  const optimizedWidth = Math.round(width * dpr);
  return `${baseUrl}?w=${optimizedWidth}&q=${quality}`;
}

/**
 * Preload critical resources
 */
export function preloadResource(url: string, type: 'image' | 'script' | 'style'): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = type;
  document.head.appendChild(link);
}

/**
 * Batch DOM updates to reduce reflows
 */
export function batchDOMUpdates(updates: (() => void)[]): void {
  requestAnimationFrame(() => {
    updates.forEach((update) => update());
  });
}

/**
 * Virtual scrolling helper - calculate visible items
 */
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 3
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + overscan * 2);

  return { start, end };
}

/**
 * Check if element is in viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Performance monitoring
 */
export const performanceMonitor = {
  marks: new Map<string, number>(),

  mark: (name: string): void => {
    performanceMonitor.marks.set(name, performance.now());
  },

  measure: (name: string, startMark: string): number => {
    const startTime = performanceMonitor.marks.get(startMark);
    if (!startTime) {
      console.warn(`Start mark "${startMark}" not found`);
      return 0;
    }

    const duration = performance.now() - startTime;
    console.log(`${name}: ${duration.toFixed(2)}ms`);
    return duration;
  },

  clear: (): void => {
    performanceMonitor.marks.clear();
  },
};

/**
 * Web Worker utility for offloading heavy computations
 */
export function createWorker(workerFunction: () => void): Worker {
  const blob = new Blob([`(${workerFunction.toString()})()`], {
    type: 'application/javascript',
  });
  return new Worker(URL.createObjectURL(blob));
}

/**
 * Optimize bundle by checking if module should be loaded
 */
export function shouldLoadModule(moduleName: string): boolean {
  const userRole = localStorage.getItem('userRole');
  const modulePermissions: Record<string, string[]> = {
    analytics: ['MANAGER', 'ADMIN'],
    kitchen: ['KITCHEN_STAFF', 'MANAGER', 'ADMIN'],
    delivery: ['DRIVER', 'MANAGER', 'ADMIN'],
    pos: ['CASHIER', 'MANAGER', 'ADMIN'],
  };

  const allowedRoles = modulePermissions[moduleName];
  return !allowedRoles || (!!userRole && allowedRoles.includes(userRole));
}
