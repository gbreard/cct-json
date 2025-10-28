import { useState } from "react";
import { useDocStore } from "../state/useDocStore";
import { validateCapitulosUnicos, validateArticulosUnicos } from "../lib/validator";
import SearchBar from "./SearchBar";
import HelpModal from "./HelpModal";

interface ToolbarProps {
  onSave: () => void;
  lastSaved?: Date | null;
  isSaving?: boolean;
}

export default function Toolbar({ onSave, lastSaved, isSaving }: ToolbarProps) {
  const { doc, setValidationErrors } = useDocStore();
  const [showHelp, setShowHelp] = useState(false);

  const handleValidate = () => {
    if (!doc) return;

    const errors: string[] = [];

    // Validación básica de estructura
    if (!doc.metadata) {
      errors.push("Falta metadata en el documento");
    }
    if (!doc.estructura) {
      errors.push("Falta estructura en el documento");
    }

    // Validaciones custom solo si hay capítulos
    if (doc.estructura?.capitulos) {
      const capError = validateCapitulosUnicos(doc.estructura.capitulos);
      if (capError) errors.push(capError);

      doc.estructura.capitulos.forEach((cap) => {
        const artError = validateArticulosUnicos(cap.articulos);
        if (artError) errors.push(`Capítulo ${cap.numero}: ${artError}`);
      });
    }

    setValidationErrors(errors);

    if (errors.length === 0) {
      alert("✅ Documento válido. No se encontraron errores.");
    } else {
      alert(`❌ Se encontraron ${errors.length} errores de validación. Revisa la lista abajo.`);
    }
  };

  return (
    <div
      style={{
        padding: "10px 20px",
        background: "#fff",
        borderBottom: "1px solid #ddd",
        display: "flex",
        gap: "10px",
        alignItems: "center",
        justifyContent: "space-between"
      }}
    >
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <button
          onClick={handleValidate}
          style={{
            padding: "10px 20px",
            background: "#2196f3",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          ✓ Validar
        </button>
        <button
          onClick={onSave}
          style={{
            padding: "10px 20px",
            background: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          💾 Guardar
        </button>

        <button
          onClick={() => setShowHelp(true)}
          style={{
            padding: "10px 20px",
            background: "#ff9800",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
          title="Ver guía de uso"
        >
          ❓ Ayuda
        </button>

        <div style={{ borderLeft: "1px solid #ddd", height: "30px", margin: "0 5px" }} />

        <SearchBar />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        {/* Autosave indicator */}
        {lastSaved && (
          <div style={{
            fontSize: "13px",
            color: isSaving ? "#2196f3" : "#999",
            display: "flex",
            alignItems: "center",
            gap: "5px"
          }}>
            {isSaving ? (
              <>
                <span style={{ animation: "pulse 1s infinite" }}>💾</span>
                Guardando...
              </>
            ) : (
              <>
                ✓ Guardado {new Date().getTime() - lastSaved.getTime() < 60000
                  ? "hace un momento"
                  : `${Math.floor((new Date().getTime() - lastSaved.getTime()) / 60000)} min`
                }
              </>
            )}
          </div>
        )}

        {/* Document stats */}
        <div style={{ fontSize: "14px", color: "#666" }}>
          {doc && (
            <>
              {doc.estructura.capitulos && (
                <>
                  {doc.estructura.capitulos.length} capítulos •
                  {doc.estructura.capitulos.reduce((sum, cap) => sum + cap.articulos.length, 0)} artículos
                </>
              )}
              {doc.estructura.clausulas && (
                <>
                  {doc.estructura.clausulas.length} cláusulas
                </>
              )}
              {!doc.estructura.capitulos && !doc.estructura.clausulas && (
                <>Documento sin estructura</>
              )}
            </>
          )}
        </div>
      </div>

      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
