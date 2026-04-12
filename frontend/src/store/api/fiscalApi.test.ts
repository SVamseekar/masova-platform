import { describe, it, expect } from 'vitest';
import { fiscalApi } from './fiscalApi';

describe('fiscalApi', () => {
  it('defines useGetFiscalSummaryQuery endpoint', () => {
    expect(fiscalApi.endpoints.getFiscalSummary).toBeDefined();
  });

  it('defines useGetSigningFailuresQuery endpoint', () => {
    expect(fiscalApi.endpoints.getSigningFailures).toBeDefined();
  });
});
