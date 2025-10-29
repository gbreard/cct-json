import { useState } from "react";
import { useDocStore } from "../state/useDocStore";
import { validateCapitulosUnicos, validateArticulosUnicos } from "../lib/validator";
import { getAutosaveData, clearAutosave } from "../hooks/useAutosave";
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

  const handleDownloadBackup = () => {
    if (!doc) return;

    const autosaveData = getAutosaveData(doc.metadata.nombre_archivo);

    if (!autosaveData) {
      alert("❌ No hay respaldo local guardado todavía.\n\nEl guardado automático funciona cada 30 segundos.");
      return;
    }

    const fecha = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    const nombreBase = doc.metadata.nombre_archivo || "documento";
    const nombreArchivo = `${nombreBase}_RESPALDO_${fecha}.json`;

    // Descargar el JSON del respaldo
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(autosaveData.data, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = dataStr;
    downloadAnchor.download = nombreArchivo;
    downloadAnchor.click();

    const savedDate = autosaveData.timestamp ? new Date(autosaveData.timestamp) : new Date();
    const timeAgo = Math.round((new Date().getTime() - savedDate.getTime()) / 60000);

    alert(
      `✅ Respaldo local descargado\n\n` +
      `Archivo: ${nombreArchivo}\n` +
      `Guardado hace: ${timeAgo} minuto${timeAgo !== 1 ? 's' : ''}\n\n` +
      `Este es el respaldo automático que se mantiene en tu navegador.`
    );
  };

  const handleClearBackup = () => {
    if (!doc) return;

    const confirmClear = confirm(
      `⚠️ ¿LIMPIAR RESPALDO AUTOMÁTICO?\n\n` +
      `Esto eliminará el respaldo local guardado en el navegador.\n\n` +
      `SOLO hacé esto si:\n` +
      `• Ya descargaste el archivo final\n` +
      `• Querés empezar desde cero con la versión original\n` +
      `• Estás seguro de que no necesitás recuperar cambios\n\n` +
      `¿Estás SEGURO de que querés limpiar el respaldo?`
    );

    if (confirmClear) {
      clearAutosave(doc.metadata.nombre_archivo);
      alert(
        `✅ Respaldo local eliminado\n\n` +
        `La próxima vez que cargues este documento, se abrirá la versión original del servidor.\n\n` +
        `El guardado automático seguirá funcionando normalmente.`
      );
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

        <button
          onClick={handleDownloadBackup}
          style={{
            padding: "10px 20px",
            background: "#9c27b0",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
          title="Descargar respaldo del navegador"
        >
          📥 Respaldo Local
        </button>

        <button
          onClick={handleClearBackup}
          style={{
            padding: "10px 20px",
            background: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
          title="Limpiar respaldo automático (usar con precaución)"
        >
          🗑️ Limpiar Respaldo
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
