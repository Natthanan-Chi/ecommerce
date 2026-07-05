"use client";

import { useEffect } from "react";
import { AdminRouteErrorFallback } from "../../../components/admin/AdminLoadingAndErrorStates";

export default function AdminProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin products route error]", error);
  }, [error]);

  return (
    <AdminRouteErrorFallback
      title="Products view problem"
      message="The admin product catalog could not render. Retry the view or return to admin."
      error={error}
      reset={reset}
    />
  );
}
