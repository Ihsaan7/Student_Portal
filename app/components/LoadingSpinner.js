"use client";

export default function LoadingSpinner({ size = "medium", variant = "primary" }) {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12"
  };

  const getSpinnerStyle = (variant) => {
    switch (variant) {
      case "primary":
        return { borderColor: 'hsl(var(--primary))', borderTopColor: 'transparent' };
      case "muted":
        return { borderColor: 'hsl(var(--muted-foreground))', borderTopColor: 'transparent' };
      case "white":
        return { borderColor: 'white', borderTopColor: 'transparent' };
      default:
        return { borderColor: 'hsl(var(--primary))', borderTopColor: 'transparent' };
    }
  };

  return (
    <div className="flex justify-center items-center">
      <div 
        className={`${sizeClasses[size]} border-2 rounded-full animate-spin`}
        style={getSpinnerStyle(variant)}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

// Alternative spinner with text
export function LoadingSpinnerWithText({ text = "Loading...", size = "medium", variant = "primary" }) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <LoadingSpinner size={size} variant={variant} />
      <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{text}</p>
    </div>
  );
}

// Inline spinner for buttons
export function InlineSpinner({ size = "small", variant = "white" }) {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-5 h-5"
  };

  const getInlineSpinnerStyle = (variant) => {
    switch (variant) {
      case "white":
        return { borderColor: 'white', borderTopColor: 'transparent' };
      case "primary":
        return { borderColor: 'hsl(var(--primary))', borderTopColor: 'transparent' };
      case "current":
        return { borderColor: 'currentColor', borderTopColor: 'transparent' };
      default:
        return { borderColor: 'white', borderTopColor: 'transparent' };
    }
  };

  return (
    <div 
      className={`${sizeClasses[size]} border-2 rounded-full animate-spin`}
      style={getInlineSpinnerStyle(variant)}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}