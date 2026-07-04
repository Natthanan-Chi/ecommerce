"use client";

import { useEffect } from "react";
import { RouteErrorFallback } from "../../components/customer/LoadingAndErrorStates";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[products route error]", error);
  }, [error]);

  return (
    <RouteErrorFallback
      title="Catalog problem"
      message="The product catalog could not render. Retry the page or return to the store."
      error={error}
      reset={reset}
    />
  );
}
