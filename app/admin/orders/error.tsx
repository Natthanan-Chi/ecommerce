"use client";

import { useEffect } from "react";
import { AdminRouteErrorFallback } from "../../../components/admin/AdminLoadingAndErrorStates";

export default function AdminOrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin orders route error]", error);
  }, [error]);

  return (
    <AdminRouteErrorFallback
      title="Orders view problem"
      message="The admin orders page could not render. Retry the view or return to admin."
      error={error}
      reset={reset}
    />
  );
}
