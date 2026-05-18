import { describe, it, expect } from 'vitest';
import { fiscalApi } from './fiscalApi';

describe('fiscalApi', () => {
  it('has correct reducerPath', () => {
    expect(fiscalApi.reducerPath).toBe('fiscalApi');
  });
});
