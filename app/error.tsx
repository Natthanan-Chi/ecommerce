"use client";

import { useEffect } from "react";
import { RouteErrorFallback } from "../components/customer/LoadingAndErrorStates";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route error]", error);
  }, [error]);

  return <RouteErrorFallback error={error} reset={reset} />;
}
