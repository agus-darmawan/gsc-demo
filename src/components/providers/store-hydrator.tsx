"use client";

import { useEffect } from "react";
import { rehydrateStores } from "@/stores/hydration";

/** Restores persisted stores after the first client render. */
export function StoreHydrator() {
  useEffect(() => {
    void rehydrateStores();
  }, []);
  return null;
}
