"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-20">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        We couldn&apos;t load this view. Check your connection and try again.
      </p>
      <button onClick={reset} className="btn btn-primary mt-6">
        Try again
      </button>
    </div>
  );
}
