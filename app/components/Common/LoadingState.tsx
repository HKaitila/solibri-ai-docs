// app/components/Common/LoadingState.tsx

export default function LoadingState() {
  return (
    <div className="col-span-1 lg:col-span-2 space-y-4 animate-in fade-in">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="space-y-3">
            <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      ))}
      
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-400 border-r-transparent animate-spin" />
          <p className="text-sm text-blue-900 font-medium">
            Analyzing your release notes...
          </p>
        </div>
      </div>
    </div>
  );
}
