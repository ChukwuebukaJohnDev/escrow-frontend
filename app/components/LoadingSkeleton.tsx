import React from "react";

interface LoadingSkeletonProps {
  className?: string;
  interactive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
  tabIndex?: number;
}

export default function LoadingSkeleton({
  className = "",
  interactive = false,
  disabled = false,
  onClick,
  "aria-label": ariaLabel,
  tabIndex,
}: LoadingSkeletonProps) {
  const interactiveClasses = interactive
    ? "cursor-pointer transition-all duration-200 ease-in-out hover:border-gray-700 hover:bg-gray-900/90 hover:shadow-lg hover:shadow-gray-950/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
    : "";

  const disabledClasses = disabled
    ? "opacity-50 cursor-not-allowed pointer-events-none"
    : "";

  return (
    <div
      className={`animate-pulse ${interactiveClasses} ${disabledClasses} ${className}`}
      role={interactive ? "button" : "status"}
      aria-live={interactive ? undefined : "polite"}
      aria-disabled={disabled ? "true" : undefined}
      tabIndex={interactive ? (disabled ? -1 : tabIndex ?? 0) : undefined}
      onClick={!disabled ? onClick : undefined}
      onKeyDown={
        interactive && !disabled && onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={ariaLabel}
    >
      <span className="sr-only">Loading job data...</span>
      <div
        className="border border-gray-800 rounded-xl bg-gray-900 p-6 space-y-6 transition-colors duration-200"
        aria-hidden="true"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-6 w-32 bg-gray-800 rounded mb-2 transition-colors duration-200"></div>
            <div className="h-4 w-24 bg-gray-800 rounded transition-colors duration-200"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-3 transition-colors duration-200 hover:bg-gray-750">
            <div className="h-4 w-12 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 w-28 bg-gray-700 rounded"></div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 transition-colors duration-200 hover:bg-gray-750">
            <div className="h-4 w-12 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 w-28 bg-gray-700 rounded"></div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 transition-colors duration-200 hover:bg-gray-750">
            <div className="h-4 w-12 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 w-28 bg-gray-700 rounded"></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="border border-gray-800 rounded-lg p-4 bg-gray-900 transition-colors duration-200 hover:border-gray-700">
            <div className="h-4 w-24 bg-gray-800 rounded mb-2"></div>
            <div className="h-4 w-32 bg-gray-800 rounded"></div>
          </div>
          <div className="border border-gray-800 rounded-lg p-4 bg-gray-900 transition-colors duration-200 hover:border-gray-700">
            <div className="h-4 w-24 bg-gray-800 rounded mb-2"></div>
            <div className="h-4 w-32 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}