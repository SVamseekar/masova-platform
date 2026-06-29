/**
 * Pact Configuration for MaSoVa Frontend
 * Consumer-Driven Contract Testing Setup
 *
 * Providers match the 4 backend services that run a *PactVerificationIT
 * (core-service, commerce-service, payment-service, logistics-service) —
 * api-gateway and intelligence-service have no provider verification test.
 */

export const pactConfig = {
  consumer: 'masova-frontend',
  dir: './pacts',
  logLevel: 'warn' as const,
};

export const providers = {
  coreService: {
    provider: 'core-service',
  },
  commerceService: {
    provider: 'commerce-service',
  },
  paymentService: {
    provider: 'payment-service',
  },
  logisticsService: {
    provider: 'logistics-service',
  },
};

export default pactConfig;
