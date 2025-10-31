import { useState, useEffect } from "react";

interface LockInfo {
  key: string;
  fileName: string;
  userName: string;
  timestamp: string;
  lastHeartbeat: string;
}

export default function AdminPanel() {
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [locks, setLocks] = useState<LockInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocks = async () => {
    try {
      const response = await fetch('/api/list-locks');
      const data = await response.json();

      if (response.ok) {
        setLocks(data.locks || []);
      }
    } catch (error) {
      console.error('Error fetching locks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocks();
    // Refrescar cada 10 segundos
    const interval = setInterval(fetchLocks, 10000);
    return () => clearInterval(interval);
  }, []);

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
        // Refrescar lista de locks
        await fetchLocks();
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
      minWidth: "300px",
      maxWidth: "400px",
      maxHeight: "80vh",
      overflow: "auto"
    }}>
      <div style={{
        fontSize: "14px",
        fontWeight: "bold",
        marginBottom: "10px",
        color: "#f44336"
      }}>
        🔧 Panel de Administración
      </div>

      {/* Mostrar información de locks */}
      <div style={{
        fontSize: "12px",
        marginBottom: "10px",
        padding: "8px",
        background: locks.length > 0 ? "#fff3e0" : "#e8f5e9",
        borderRadius: "4px",
        color: locks.length > 0 ? "#e65100" : "#2e7d32"
      }}>
        {loading ? (
          "Cargando..."
        ) : (
          <>
            <strong>Locks activos: {locks.length}</strong>
            {locks.length > 0 && (
              <div style={{ marginTop: "8px", fontSize: "11px" }}>
                {locks.map((lock, i) => (
                  <div key={i} style={{
                    marginBottom: "6px",
                    paddingBottom: "6px",
                    borderBottom: i < locks.length - 1 ? "1px solid #ffcc80" : "none"
                  }}>
                    <div><strong>📄 {lock.fileName}</strong></div>
                    <div>👤 {lock.userName}</div>
                    <div>🕐 {new Date(lock.timestamp).toLocaleString('es-AR')}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <button
        onClick={handleClearLocks}
        disabled={clearing || locks.length === 0}
        style={{
          width: "100%",
          padding: "10px",
          background: clearing || locks.length === 0 ? "#ccc" : "#f44336",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: clearing || locks.length === 0 ? "not-allowed" : "pointer",
          fontWeight: "bold",
          fontSize: "13px"
        }}
      >
        {clearing ? "Limpiando..." : locks.length === 0 ? "✅ Sin Locks Activos" : `🔓 Limpiar ${locks.length} Lock(s)`}
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
