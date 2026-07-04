"use client";

import { useEffect } from "react";
import { RouteErrorFallback } from "../../components/customer/LoadingAndErrorStates";

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[account route error]", error);
  }, [error]);

  return (
    <RouteErrorFallback
      title="Account view problem"
      message="Your account page could not render. Retry the view or return to the store."
      error={error}
      reset={reset}
    />
  );
}
