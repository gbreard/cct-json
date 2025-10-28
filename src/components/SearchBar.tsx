import { useState } from "react";
import { useDocStore } from "../state/useDocStore";

export default function SearchBar() {
  const {
    searchTerm,
    searchResults,
    currentSearchIndex,
    setSearchTerm,
    goToNextSearchResult,
    goToPrevSearchResult,
    clearSearch
  } = useDocStore();

  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClear = () => {
    clearSearch();
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        goToPrevSearchResult();
      } else {
        goToNextSearchResult();
      }
    } else if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          style={{
            padding: "10px 20px",
            background: "#757575",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
          title="Buscar (Ctrl+F)"
        >
          🔍 Buscar
        </button>
      ) : (
        <>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: "#f5f5f5",
            padding: "5px 10px",
            borderRadius: "5px",
            border: "1px solid #ddd"
          }}>
            <input
              type="text"
              placeholder="Buscar en el documento..."
              value={searchTerm}
              onChange={handleSearch}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{
                border: "none",
                outline: "none",
                padding: "5px",
                fontSize: "14px",
                width: "250px",
                background: "transparent"
              }}
            />

            {searchTerm && (
              <>
                <span style={{
                  fontSize: "13px",
                  color: "#666",
                  whiteSpace: "nowrap",
                  borderLeft: "1px solid #ddd",
                  paddingLeft: "10px"
                }}>
                  {searchResults.length > 0
                    ? `${currentSearchIndex + 1} / ${searchResults.length}`
                    : "0 resultados"
                  }
                </span>

                <button
                  onClick={goToPrevSearchResult}
                  disabled={searchResults.length === 0}
                  style={{
                    padding: "3px 8px",
                    background: searchResults.length === 0 ? "#ddd" : "#2196f3",
                    color: searchResults.length === 0 ? "#999" : "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: searchResults.length === 0 ? "not-allowed" : "pointer",
                    fontSize: "12px"
                  }}
                  title="Anterior (Shift+Enter)"
                >
                  ◀
                </button>

                <button
                  onClick={goToNextSearchResult}
                  disabled={searchResults.length === 0}
                  style={{
                    padding: "3px 8px",
                    background: searchResults.length === 0 ? "#ddd" : "#2196f3",
                    color: searchResults.length === 0 ? "#999" : "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: searchResults.length === 0 ? "not-allowed" : "pointer",
                    fontSize: "12px"
                  }}
                  title="Siguiente (Enter)"
                >
                  ▶
                </button>
              </>
            )}

            <button
              onClick={handleClear}
              style={{
                padding: "3px 8px",
                background: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "3px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "bold"
              }}
              title="Cerrar (Esc)"
            >
              ✕
            </button>
          </div>
        </>
      )}
    </div>
  );
}
