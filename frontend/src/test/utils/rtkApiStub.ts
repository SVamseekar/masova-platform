/**
 * Minimal RTK Query API slice stubs for vi.mock partial mocks.
 * Use with vi.hoisted() in test files — do not import stubs directly into vi.mock factories.
 */
type RtkMiddleware = (action: unknown) => unknown;

export function createRtkApiStub(reducerPath: string) {
  return {
    reducerPath,
    reducer: () => ({}),
    middleware: () => (next: RtkMiddleware) => (action: unknown) => next(action),
  };
}