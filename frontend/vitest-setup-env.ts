// This runs before the test environment (jsdom) is set up.
// Save native AbortController/AbortSignal before jsdom can override them.
import { AbortController, AbortSignal } from 'node:events';
