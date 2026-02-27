import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { applyFilters, applySort, getNestedValue, exportToCSV, commonFilters } from './filterUtils';

describe('getNestedValue', () => {
  it('returns a top-level property value', () => {
    expect(getNestedValue({ name: 'John' }, 'name')).toBe('John');
  });

  it('returns a nested property value using dot notation', () => {
    const obj = { user: { address: { city: 'Amsterdam' } } };
    expect(getNestedValue(obj, 'user.address.city')).toBe('Amsterdam');
  });

  it('returns undefined for missing path', () => {
    expect(getNestedValue({ a: 1 }, 'b.c')).toBeUndefined();
  });

  it('returns undefined for null input', () => {
    expect(getNestedValue(null, 'a')).toBeUndefined();
  });
});

describe('applyFilters', () => {
  const data = [
    { id: '1', name: 'Pizza', status: 'ACTIVE', category: 'FOOD', createdAt: '2024-06-01' },
    { id: '2', name: 'Burger', status: 'INACTIVE', category: 'FOOD', createdAt: '2024-07-01' },
    { id: '3', name: 'Coke', status: 'ACTIVE', category: 'DRINK', createdAt: '2024-08-01' },
  ];

  it('returns all items when filter values are empty', () => {
    const result = applyFilters(data, {}, {});
    expect(result).toHaveLength(3);
  });

  it('filters by string value using default behavior', () => {
    const result = applyFilters(data, { name: 'pizza' }, {});
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filters by array value using default behavior', () => {
    const result = applyFilters(data, { status: ['ACTIVE'] }, {});
    expect(result).toHaveLength(2);
  });

  it('skips empty string filter values', () => {
    const result = applyFilters(data, { name: '' }, {});
    expect(result).toHaveLength(3);
  });

  it('skips empty array filter values', () => {
    const result = applyFilters(data, { status: [] }, {});
    expect(result).toHaveLength(3);
  });

  it('uses custom filter function when provided', () => {
    const filterConfig = {
      name: (item: any, value: string) => item.name.startsWith(value),
    };
    const result = applyFilters(data, { name: 'B' }, filterConfig);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Burger');
  });

  it('filters by date range with from and to', () => {
    const result = applyFilters(
      data,
      { createdAt: { from: '2024-06-15', to: '2024-07-15' } },
      {}
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('filters by date range with only from', () => {
    const result = applyFilters(
      data,
      { createdAt: { from: '2024-07-01' } },
      {}
    );
    expect(result).toHaveLength(2);
  });

  it('filters by date range with only to', () => {
    const result = applyFilters(
      data,
      { createdAt: { to: '2024-06-30' } },
      {}
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('skips date range filter with empty from and to', () => {
    const result = applyFilters(
      data,
      { createdAt: { from: undefined, to: undefined } },
      {}
    );
    expect(result).toHaveLength(3);
  });
});

describe('applySort', () => {
  const data = [
    { id: '1', name: 'Charlie', price: 30, createdAt: '2024-03-01' },
    { id: '2', name: 'Alice', price: 10, createdAt: '2024-01-01' },
    { id: '3', name: 'Bob', price: 20, createdAt: '2024-02-01' },
  ];

  it('returns data as-is when no sortConfig is provided', () => {
    const result = applySort(data);
    expect(result).toEqual(data);
  });

  it('sorts strings ascending', () => {
    const result = applySort(data, { field: 'name', direction: 'asc' });
    expect(result.map(d => d.name)).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('sorts strings descending', () => {
    const result = applySort(data, { field: 'name', direction: 'desc' });
    expect(result.map(d => d.name)).toEqual(['Charlie', 'Bob', 'Alice']);
  });

  it('sorts numbers ascending', () => {
    const result = applySort(data, { field: 'price', direction: 'asc' });
    expect(result.map(d => d.price)).toEqual([10, 20, 30]);
  });

  it('sorts numbers descending', () => {
    const result = applySort(data, { field: 'price', direction: 'desc' });
    expect(result.map(d => d.price)).toEqual([30, 20, 10]);
  });

  it('sorts dates ascending', () => {
    const result = applySort(data, { field: 'createdAt', direction: 'asc' });
    expect(result.map(d => d.id)).toEqual(['2', '3', '1']);
  });

  it('does not mutate the original array', () => {
    const original = [...data];
    applySort(data, { field: 'name', direction: 'asc' });
    expect(data).toEqual(original);
  });

  it('handles null values - puts them last in ascending order', () => {
    const dataWithNull = [
      { id: '1', name: 'Alice', value: null },
      { id: '2', name: 'Bob', value: 5 },
    ];
    const result = applySort(dataWithNull as any, { field: 'value', direction: 'asc' });
    expect(result[0].id).toBe('2');
    expect(result[1].id).toBe('1');
  });
});

describe('exportToCSV', () => {
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('shows alert for empty data', () => {
    const columns = [{ label: 'Name', field: 'name' }];
    exportToCSV([], 'test', columns);
    expect(alertSpy).toHaveBeenCalledWith('No data to export');
  });

  it('creates a CSV file and triggers download', () => {
    const data = [{ name: 'Pizza', price: 10 }];
    const columns = [
      { label: 'Name', field: 'name' },
      { label: 'Price', field: 'price' },
    ];

    const createObjectURLSpy = vi.fn().mockReturnValue('blob:url');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

    // Mock URL.createObjectURL
    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = createObjectURLSpy;

    const clickSpy = vi.fn();
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      setAttribute: vi.fn(),
      click: clickSpy,
      style: {},
    } as any);

    exportToCSV(data, 'test', columns);

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    URL.createObjectURL = originalCreateObjectURL;
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('escapes values containing commas', () => {
    const data = [{ name: 'Pizza, Large', price: 10 }];
    const columns = [{ label: 'Name', field: 'name' }];

    const blobContent: string[] = [];
    const originalBlob = global.Blob;
    (global as any).Blob = class MockBlob {
      constructor(parts: string[]) {
        blobContent.push(...parts);
      }
    };

    const createObjectURLSpy = vi.fn().mockReturnValue('blob:url');
    URL.createObjectURL = createObjectURLSpy;

    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {},
    } as any);

    exportToCSV(data, 'test', columns);

    expect(blobContent[0]).toContain('"Pizza, Large"');

    global.Blob = originalBlob;
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });
});

describe('commonFilters', () => {
  describe('searchText', () => {
    it('matches text across specified fields', () => {
      const item = { name: 'Pizza', description: 'Cheese pizza' };
      expect(commonFilters.searchText(item, 'cheese', ['name', 'description'])).toBe(true);
    });

    it('returns false when text does not match any field', () => {
      const item = { name: 'Pizza', description: 'Cheese pizza' };
      expect(commonFilters.searchText(item, 'burger', ['name', 'description'])).toBe(false);
    });

    it('performs case-insensitive matching', () => {
      const item = { name: 'Pizza' };
      expect(commonFilters.searchText(item, 'PIZZA', ['name'])).toBe(true);
    });
  });

  describe('status', () => {
    it('matches when status equals value', () => {
      const item = { status: 'ACTIVE' };
      expect(commonFilters.status(item, 'ACTIVE')).toBe(true);
    });

    it('does not match when status differs', () => {
      const item = { status: 'INACTIVE' };
      expect(commonFilters.status(item, 'ACTIVE')).toBe(false);
    });

    it('uses custom status field', () => {
      const item = { orderStatus: 'PENDING' };
      expect(commonFilters.status(item, 'PENDING', 'orderStatus')).toBe(true);
    });
  });

  describe('dateRange', () => {
    it('filters with both from and to dates', () => {
      const item = { createdAt: '2024-06-15' };
      const result = commonFilters.dateRange(item, { from: '2024-06-01', to: '2024-06-30' }, 'createdAt');
      expect(result).toBe(true);
    });

    it('returns true when item date field is null', () => {
      const item = { createdAt: null };
      const result = commonFilters.dateRange(item, { from: '2024-06-01' }, 'createdAt');
      expect(result).toBe(true);
    });
  });

  describe('multiSelect', () => {
    it('matches when item value is in selected values', () => {
      const item = { category: 'FOOD' };
      expect(commonFilters.multiSelect(item, ['FOOD', 'DRINK'], 'category')).toBe(true);
    });

    it('does not match when item value is not in selected values', () => {
      const item = { category: 'DESSERT' };
      expect(commonFilters.multiSelect(item, ['FOOD', 'DRINK'], 'category')).toBe(false);
    });
  });
});
