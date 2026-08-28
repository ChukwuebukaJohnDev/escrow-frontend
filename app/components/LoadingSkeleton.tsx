export default function LoadingSkeleton() {
    return (
        <div className="animate-pulse w-full" role="status" aria-live="polite" data-testid="loading-skeleton">
            <span className="sr-only">Loading job data…</span>
            <div
                className="border border-gray-800 rounded-xl bg-gray-900 p-4 sm:p-6 space-y-4 sm:space-y-6"
                aria-hidden="true"
                data-testid="loading-skeleton-card"
            >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6">
                    <div className="space-y-2">
                        <div className="h-6 w-24 sm:w-32 bg-gray-800 rounded"></div>
                        <div className="h-4 w-20 sm:w-24 bg-gray-800 rounded"></div>
                    </div>
                </div>
                <div
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6"
                    data-testid="loading-skeleton-stats"
                >
                    <div className="bg-gray-800 rounded-lg p-3">
                        <div className="h-4 w-12 bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 w-full sm:w-28 bg-gray-700 rounded"></div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                        <div className="h-4 w-12 bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 w-full sm:w-28 bg-gray-700 rounded"></div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                        <div className="h-4 w-12 bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 w-full sm:w-28 bg-gray-700 rounded"></div>
                    </div>
                </div>
                <div className="space-y-3 sm:space-y-4" data-testid="loading-skeleton-rows">
                    <div className="border border-gray-800 rounded-lg p-3 sm:p-4 bg-gray-900">
                        <div className="h-4 w-20 sm:w-24 bg-gray-800 rounded mb-2"></div>
                        <div className="h-4 w-full sm:w-32 bg-gray-800 rounded"></div>
                    </div>
                    <div className="border border-gray-800 rounded-lg p-3 sm:p-4 bg-gray-900">
                        <div className="h-4 w-20 sm:w-24 bg-gray-800 rounded mb-2"></div>
                        <div className="h-4 w-full sm:w-32 bg-gray-800 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
