"use client";

import { useEffect } from "react";
import { AdminRouteErrorFallback } from "../../../components/admin/AdminLoadingAndErrorStates";

export default function AdminReviewsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin reviews route error]", error);
  }, [error]);

  return (
    <AdminRouteErrorFallback
      title="Reviews view problem"
      message="The admin reviews page could not render. Retry the view or return to admin."
      error={error}
      reset={reset}
    />
  );
}
