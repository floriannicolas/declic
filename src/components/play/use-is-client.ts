import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** False during prerender and hydration, true afterwards. Random draws only happen client side. */
export const useIsClient = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
