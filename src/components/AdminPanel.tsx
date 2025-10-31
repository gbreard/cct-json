import { useState } from "react";

export default function AdminPanel() {
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleClearLocks = async () => {
    if (!confirm("⚠️ ¿Limpiar TODOS los locks?\n\nEsto liberará todos los documentos bloqueados.")) {
      return;
    }

    setClearing(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin-clear-locks');
      const data = await response.json();

      if (response.ok) {
        setResult(`✅ ${data.message}\n\nDocumentos liberados: ${data.locksRemoved}`);
      } else {
        setResult(`❌ Error: ${data.error || data.message}`);
      }
    } catch (error) {
      setResult(`❌ Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      background: "white",
      border: "2px solid #f44336",
      borderRadius: "8px",
      padding: "15px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 10000,
      minWidth: "250px"
    }}>
      <div style={{
        fontSize: "14px",
        fontWeight: "bold",
        marginBottom: "10px",
        color: "#f44336"
      }}>
        🔧 Panel de Administración
      </div>

      <button
        onClick={handleClearLocks}
        disabled={clearing}
        style={{
          width: "100%",
          padding: "10px",
          background: clearing ? "#ccc" : "#f44336",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: clearing ? "not-allowed" : "pointer",
          fontWeight: "bold",
          fontSize: "13px"
        }}
      >
        {clearing ? "Limpiando..." : "🔓 Limpiar Todos los Locks"}
      </button>

      {result && (
        <div style={{
          marginTop: "10px",
          padding: "10px",
          background: result.includes("✅") ? "#e8f5e9" : "#ffebee",
          borderRadius: "4px",
          fontSize: "12px",
          whiteSpace: "pre-line",
          color: result.includes("✅") ? "#2e7d32" : "#c62828"
        }}>
          {result}
        </div>
      )}
    </div>
  );
}
