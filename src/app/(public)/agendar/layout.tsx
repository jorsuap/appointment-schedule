import { Suspense } from 'react';

export default function AgendarLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<AgendarLoading />}>{children}</Suspense>;
}

function AgendarLoading() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16">
      <div className="flex flex-col items-center gap-4">
        <div className="h-6 w-32 animate-pulse rounded bg-secondary" />
        <div className="h-8 w-64 animate-pulse rounded bg-secondary" />
        <div className="h-4 w-48 animate-pulse rounded bg-secondary" />
      </div>
    </div>
  );
}
