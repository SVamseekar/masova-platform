import { builtinEnvironments, populateGlobal } from 'vitest/environments';

export default {
  name: 'jsdom-with-native-abort',
  transformMode: 'web',
  async setup(global, options) {
    // Save Node's native AbortController/AbortSignal BEFORE jsdom overwrites them
    const nativeAbortController = global.AbortController;
    const nativeAbortSignal = global.AbortSignal;

    // Set up jsdom environment
    const { teardown } = await builtinEnvironments.jsdom.setup(global, options);

    // Restore native AbortController/AbortSignal so Node's fetch (undici) instanceof checks pass
    // This fixes: "TypeError: RequestInit: Expected signal to be an instance of AbortSignal"
    // when using RTK Query's fetchBaseQuery with MSW 2.x on Node 22+
    global.AbortController = nativeAbortController;
    global.AbortSignal = nativeAbortSignal;

    return { teardown };
  },
};
