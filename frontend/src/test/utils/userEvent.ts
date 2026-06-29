import userEvent from '@testing-library/user-event';

/** Default for most tests */
export const user = userEvent.setup();

/**
 * Use when asserting disabled/loading controls that set pointer-events: none.
 * user-event v14 correctly refuses those clicks; this disables the check.
 */
export const userNoPointerCheck = userEvent.setup({ pointerEventsCheck: 0 });