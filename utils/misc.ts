import { useEffect, useLayoutEffect, useState } from "react";

export function isRunningOnServer() {
  return typeof window === "undefined";
}

export const useServerLayoutEffect = isRunningOnServer()
  ? useEffect
  : useLayoutEffect;

let hasHydrated = false;
export function useIsHydrated() {
  const [isHydrated, setIsHydrated] = useState(hasHydrated);

  useEffect(() => {
    hasHydrated = true;
    setIsHydrated(true);
  }, []);

  return isHydrated;
}
