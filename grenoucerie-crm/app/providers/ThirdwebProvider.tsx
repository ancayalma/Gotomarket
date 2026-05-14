"use client";

import { ThirdwebProvider as TWProvider } from "thirdweb/react";

export function ThirdwebClientProvider({ children }: { children: React.ReactNode }) {
  return <TWProvider>{children}</TWProvider>;
}
