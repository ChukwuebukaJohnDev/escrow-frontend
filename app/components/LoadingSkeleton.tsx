export default function LoadingSkeleton() {
    return (
        <div
            className="animate-fade-in"
            role="status"
            aria-live="polite"
            data-testid="loading-skeleton"
        >
            <span className="sr-only">Loading job data…</span>
            <div
                className="border border-gray-800 rounded-xl bg-gray-900 p-6 space-y-6"
                aria-hidden="true"
                data-testid="loading-skeleton-card"
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="animate-pulse h-6 w-32 bg-gray-800 rounded mb-2"></div>
                        <div className="animate-pulse h-4 w-24 bg-gray-800 rounded [animation-delay:75ms]"></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" data-testid="loading-skeleton-stats">
                    <div
                        className="animate-pulse bg-gray-800 rounded-lg p-3 [animation-delay:100ms]"
                        data-testid="loading-skeleton-stat-0"
                    >
                        <div className="h-4 w-12 bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 w-28 bg-gray-700 rounded"></div>
                    </div>
                    <div
                        className="animate-pulse bg-gray-800 rounded-lg p-3 [animation-delay:175ms]"
                        data-testid="loading-skeleton-stat-1"
                    >
                        <div className="h-4 w-12 bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 w-28 bg-gray-700 rounded"></div>
                    </div>
                    <div
                        className="animate-pulse bg-gray-800 rounded-lg p-3 [animation-delay:250ms]"
                        data-testid="loading-skeleton-stat-2"
                    >
                        <div className="h-4 w-12 bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 w-28 bg-gray-700 rounded"></div>
                    </div>
                </div>
                <div className="space-y-4" data-testid="loading-skeleton-rows">
                    <div
                        className="animate-pulse border border-gray-800 rounded-lg p-4 bg-gray-900 [animation-delay:325ms]"
                        data-testid="loading-skeleton-row-0"
                    >
                        <div className="h-4 w-24 bg-gray-800 rounded mb-2"></div>
                        <div className="h-4 w-32 bg-gray-800 rounded"></div>
                    </div>
                    <div
                        className="animate-pulse border border-gray-800 rounded-lg p-4 bg-gray-900 [animation-delay:400ms]"
                        data-testid="loading-skeleton-row-1"
                    >
                        <div className="h-4 w-24 bg-gray-800 rounded mb-2"></div>
                        <div className="h-4 w-32 bg-gray-800 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
