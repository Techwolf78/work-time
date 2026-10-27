import React from "react";

interface SearchHighlightProps {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}

export function SearchHighlight({
  text,
  query,
  className = "",
  highlightClassName = "font-semibold text-gray-950 underline decoration-gray-300 underline-offset-2",
}: SearchHighlightProps) {
  if (!text) return null;
  if (!query || !query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const cleanQuery = query.trim();
  // Escape regex special characters
  const escaped = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className={`bg-transparent p-0 ${highlightClassName}`}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}
