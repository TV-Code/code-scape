"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const R3FContext = createContext<{ ready: boolean }>({ ready: false });

export function useR3F() {
  return useContext(R3FContext);
}

export function R3FProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <R3FContext.Provider value={{ ready }}>
      {children}
    </R3FContext.Provider>
  );
}