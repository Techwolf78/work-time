import React from "react";

export interface GaHrmsLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light" | "auto";
  iconOnly?: boolean;
  emblemType?: "silver" | "white" | "gradient" | "square" | "auto";
  productName?: string;
}

export const GaHrmsLogo: React.FC<GaHrmsLogoProps> = ({
  className = "",
  size = "md",
  variant = "auto",
  iconOnly = false,
  emblemType = "auto",
  productName = "WORK-TIME",
}) => {
  const sizeMap = {
    xs: {
      icon: "h-4 w-auto",
      squareIcon: "w-4 h-4 rounded",
      gaText: "text-xs",
      hrmsText: "text-xs",
      gap: "gap-1.5",
      subText: "text-[8px]",
    },
    sm: {
      icon: "h-5 w-auto",
      squareIcon: "w-5 h-5 rounded-md",
      gaText: "text-sm",
      hrmsText: "text-sm",
      gap: "gap-2",
      subText: "text-[9px]",
    },
    md: {
      icon: "h-7 w-auto",
      squareIcon: "w-7 h-7 rounded-lg",
      gaText: "text-lg",
      hrmsText: "text-lg",
      gap: "gap-2.5",
      subText: "text-[10px]",
    },
    lg: {
      icon: "h-8 w-auto",
      squareIcon: "w-8 h-8 rounded-xl",
      gaText: "text-xl",
      hrmsText: "text-xl",
      gap: "gap-3",
      subText: "text-[11px]",
    },
    xl: {
      icon: "h-11 w-auto",
      squareIcon: "w-11 h-11 rounded-2xl",
      gaText: "text-3xl",
      hrmsText: "text-3xl",
      gap: "gap-3.5",
      subText: "text-xs",
    },
  }[size];

  // Pure Monochrome Color Mapping (strictly black / white / silver)
  const gaColor =
    variant === "dark"
      ? "text-white"
      : variant === "light"
        ? "text-black"
        : "text-black dark:text-white";

  const hrmsColor =
    variant === "dark"
      ? "text-gray-200"
      : variant === "light"
        ? "text-gray-900"
        : "text-gray-900 dark:text-gray-200";

  // Determine Emblem Asset - Always renders the approved Fluent 3D Hourglass app icon
  const renderEmblem = () => {
    return (
      <img
        src="/app_icon.png"
        alt="GA WORK-TIME"
        className={`${sizeMap.squareIcon || sizeMap.icon} object-contain rounded-lg drop-shadow-sm`}
      />
    );
  };

  return (
    <div
      className={`inline-flex items-center select-none group ${sizeMap.gap} ${className}`}
    >
      {/* 🦅 Authentic Geometric G/A Emblem */}
      <div className="shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
        {renderEmblem()}
      </div>

      {/* 🏛️ Pure Monochrome Bold Italic Wordmark: GA HRMS */}
      {!iconOnly && (
        <div className="font-heading font-black italic uppercase leading-none flex items-baseline tracking-[-0.045em]">
          <span className={`${sizeMap.gaText} ${gaColor} transition-colors`}>
            GA
          </span>
          <span
            className={`${sizeMap.hrmsText} ${hrmsColor} transition-colors ml-1`}
          >
            {productName}
          </span>
        </div>
      )}
    </div>
  );
};

export default GaHrmsLogo;
