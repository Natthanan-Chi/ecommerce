"use client";

import { useEffect } from "react";
import { AdminRouteErrorFallback } from "../../components/admin/AdminLoadingAndErrorStates";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin route error]", error);
  }, [error]);

  return <AdminRouteErrorFallback error={error} reset={reset} />;
}
