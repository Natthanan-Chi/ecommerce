"use client";

import { useEffect } from "react";
import { AdminRouteErrorFallback } from "../../../components/admin/AdminLoadingAndErrorStates";

export default function AdminChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin chat route error]", error);
  }, [error]);

  return (
    <AdminRouteErrorFallback
      title="Chat view problem"
      message="The admin chat inbox could not render. Retry the view or return to admin."
      error={error}
      reset={reset}
    />
  );
}
