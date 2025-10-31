import { useState } from "react";
import { useDocStore } from "../state/useDocStore";
import { validateCapitulosUnicos, validateArticulosUnicos } from "../lib/validator";
import { type SyncStatus } from "../hooks/useAutosave";
import type { LockInfo } from "../hooks/useLock";
import SearchBar from "./SearchBar";
import HelpModal from "./HelpModal";

interface ToolbarProps {
  onSave: () => void;
  lastSaved?: Date | null;
  syncStatus?: SyncStatus;
  hasLock?: boolean;
  lockInfo?: LockInfo;
}

export default function Toolbar({ onSave, lastSaved, syncStatus, hasLock }: ToolbarProps) {
  const { doc, setValidationErrors, setEstadoRevision } = useDocStore();
  const [showHelp, setShowHelp] = useState(false);
  const [showEstadoMenu, setShowEstadoMenu] = useState(false);

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


  const handleChangeEstado = (nuevoEstado: "pendiente" | "en_revision" | "terminado") => {
    if (!doc) return;

    if (nuevoEstado === "terminado") {
      const confirm = window.confirm(
        `✅ ¿MARCAR COMO TERMINADO?\n\n` +
        `Este documento se marcará como terminado y aparecerá con estado ✅ TERMINADO en el selector.\n\n` +
        `Podrás seguir editándolo si es necesario, pero quedará registrado como completado.`
      );
      if (!confirm) return;
    }

    setEstadoRevision(nuevoEstado);
    setShowEstadoMenu(false);

    const mensajes = {
      pendiente: "⚪ Documento marcado como PENDIENTE",
      en_revision: "🟡 Documento marcado como EN REVISIÓN",
      terminado: "✅ Documento marcado como TERMINADO"
    };

    alert(mensajes[nuevoEstado]);
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

        {/* Estado del documento */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowEstadoMenu(!showEstadoMenu)}
            style={{
              padding: "10px 20px",
              background:
                doc?.metadata?.estado_revision === "terminado" ? "#4caf50" :
                doc?.metadata?.estado_revision === "en_revision" ? "#ff9800" :
                "#999",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
            title="Cambiar estado del documento"
          >
            {doc?.metadata?.estado_revision === "terminado" ? "✅ Terminado" :
             doc?.metadata?.estado_revision === "en_revision" ? "🟡 En Revisión" :
             "⚪ Pendiente"} ▾
          </button>

          {showEstadoMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: "5px",
                background: "white",
                border: "1px solid #ddd",
                borderRadius: "5px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                zIndex: 1000,
                minWidth: "200px"
              }}
            >
              <button
                onClick={() => handleChangeEstado("pendiente")}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px 20px",
                  border: "none",
                  background: doc?.metadata?.estado_revision === "pendiente" ? "#f5f5f5" : "white",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "14px"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                onMouseLeave={(e) => e.currentTarget.style.background = doc?.metadata?.estado_revision === "pendiente" ? "#f5f5f5" : "white"}
              >
                ⚪ Pendiente
              </button>
              <button
                onClick={() => handleChangeEstado("en_revision")}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px 20px",
                  border: "none",
                  background: doc?.metadata?.estado_revision === "en_revision" ? "#f5f5f5" : "white",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "14px",
                  borderTop: "1px solid #eee"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                onMouseLeave={(e) => e.currentTarget.style.background = doc?.metadata?.estado_revision === "en_revision" ? "#f5f5f5" : "white"}
              >
                🟡 En Revisión
              </button>
              <button
                onClick={() => handleChangeEstado("terminado")}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px 20px",
                  border: "none",
                  background: doc?.metadata?.estado_revision === "terminado" ? "#f5f5f5" : "white",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "14px",
                  borderTop: "1px solid #eee",
                  borderRadius: "0 0 5px 5px"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                onMouseLeave={(e) => e.currentTarget.style.background = doc?.metadata?.estado_revision === "terminado" ? "#f5f5f5" : "white"}
              >
                ✅ Marcar como Terminado
              </button>
            </div>
          )}
        </div>

        <div style={{ borderLeft: "1px solid #ddd", height: "30px", margin: "0 5px" }} />

        <SearchBar />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        {/* Lock indicator */}
        {hasLock && (
          <div style={{
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "6px 12px",
            borderRadius: "4px",
            background: "#e3f2fd",
            color: "#1976d2",
            fontWeight: "bold"
          }}>
            <span>🔒</span>
            <span>Documento bloqueado (solo tú puedes editarlo)</span>
          </div>
        )}

        {/* Save status indicator */}
        {syncStatus && syncStatus !== 'idle' && (
          <div style={{
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "6px 12px",
            borderRadius: "4px",
            background:
              syncStatus === 'synced' ? "#e8f5e9" :
              syncStatus === 'saving' ? "#e3f2fd" :
              syncStatus === 'error' ? "#ffebee" :
              "#f5f5f5",
            color:
              syncStatus === 'synced' ? "#2e7d32" :
              syncStatus === 'saving' ? "#1976d2" :
              syncStatus === 'error' ? "#c62828" :
              "#666"
          }}>
            {syncStatus === 'saving' && (
              <>
                <span>💾</span>
                <span>Guardando en servidor...</span>
              </>
            )}
            {syncStatus === 'synced' && (
              <>
                <span>✓</span>
                <span>Guardado en servidor</span>
              </>
            )}
            {syncStatus === 'error' && (
              <>
                <span>⚠️</span>
                <span>Error al guardar</span>
              </>
            )}
          </div>
        )}

        {/* Last saved indicator */}
        {lastSaved && syncStatus === 'idle' && (
          <div style={{
            fontSize: "13px",
            color: "#999",
            display: "flex",
            alignItems: "center",
            gap: "5px"
          }}>
            💾 Guardado: {new Date().getTime() - lastSaved.getTime() < 60000
              ? "hace un momento"
              : `hace ${Math.floor((new Date().getTime() - lastSaved.getTime()) / 60000)} min`
            }
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
