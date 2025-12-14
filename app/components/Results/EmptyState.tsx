// app/components/Results/EmptyState.tsx

export default function EmptyState() {
  return (
    <div className="col-span-1 lg:col-span-2">
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <p className="text-5xl mb-4">📝</p>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No analysis yet
        </h3>
        <p className="text-gray-600 mb-6">
          Paste your release notes in the input box and click "Analyze" to get started.
        </p>
        <div className="space-y-2 text-left max-w-xs mx-auto bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-900">💡 What happens next:</p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Release notes are parsed for features</li>
            <li>Matching articles are found</li>
            <li>Gaps are identified for you</li>
            <li>You can generate new articles</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
