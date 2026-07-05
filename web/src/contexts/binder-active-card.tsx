"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type BinderActiveCardContextValue = {
  activeKey: string | null;
  open: (key: string) => void;
  close: () => void;
};

const BinderActiveCardContext = createContext<BinderActiveCardContextValue | null>(
  null,
);

export function BinderActiveCardProvider({ children }: { children: ReactNode }) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const open = useCallback((key: string) => setActiveKey(key), []);
  const close = useCallback(() => setActiveKey(null), []);
  const value = useMemo(
    () => ({ activeKey, open, close }),
    [activeKey, open, close],
  );

  return (
    <BinderActiveCardContext.Provider value={value}>
      {children}
    </BinderActiveCardContext.Provider>
  );
}

export function useBinderActiveCard() {
  return useContext(BinderActiveCardContext);
}
