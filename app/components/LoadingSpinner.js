"use client";

export default function LoadingSpinner({ size = "medium", color = "blue" }) {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12"
  };

  const colorClasses = {
    blue: "border-blue-600",
    white: "border-white",
    gray: "border-gray-600"
  };

  return (
    <div className="flex justify-center items-center">
      <div 
        className={`${sizeClasses[size]} ${colorClasses[color]} border-2 border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

// Alternative spinner with text
export function LoadingSpinnerWithText({ text = "Loading...", size = "medium", color = "blue" }) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <LoadingSpinner size={size} color={color} />
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}

// Inline spinner for buttons
export function InlineSpinner({ size = "small" }) {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-5 h-5"
  };

  return (
    <div 
      className={`${sizeClasses[size]} border-2 border-white border-t-transparent rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}