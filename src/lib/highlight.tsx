import type { ReactNode } from "react";

export function highlightText(text: string, searchTerm: string): ReactNode {
  if (!searchTerm || !text) return text;

  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));

  return parts.map((part, index) => {
    if (part.toLowerCase() === searchTerm.toLowerCase()) {
      return (
        <mark
          key={index}
          style={{
            background: "#ffeb3b",
            padding: "2px 4px",
            borderRadius: "2px",
            fontWeight: "bold"
          }}
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}
