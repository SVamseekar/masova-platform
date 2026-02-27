import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW server instance for Node.js environment (Vitest tests)
 *
 * This server intercepts HTTP requests during tests and returns mock responses
 * based on the handlers defined in handlers.ts
 */
export const server = setupServer(...handlers);
