"use client";

import { useSyncExternalStore } from "react";
import { supportsPasskeys } from "./passkeys";

const subscribe = () => () => {};
const serverSnapshot = () => false;

/** Capability is stable for the lifetime of the document; SSR has no navigator. */
export function usePasskeySupport() {
  return useSyncExternalStore(subscribe, supportsPasskeys, serverSnapshot);
}
