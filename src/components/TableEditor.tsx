import { useState } from "react";

export interface TableData {
  headers: string[];
  rows: string[][];
}

interface TableEditorProps {
  value?: TableData;
  onChange: (table: TableData) => void;
}

export default function TableEditor({ value, onChange }: TableEditorProps) {
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");

  // Inicializar con tabla vacía si no hay valor
  const tableData: TableData = value || {
    headers: ["Columna 1", "Columna 2"],
    rows: [["", ""]]
  };

  const handleHeaderChange = (index: number, newValue: string) => {
    const newHeaders = [...tableData.headers];
    newHeaders[index] = newValue;
    onChange({ ...tableData, headers: newHeaders });
  };

  const handleCellChange = (rowIndex: number, colIndex: number, newValue: string) => {
    const newRows = tableData.rows.map((row, i) =>
      i === rowIndex ? row.map((cell, j) => j === colIndex ? newValue : cell) : row
    );
    onChange({ ...tableData, rows: newRows });
  };

  const addRow = () => {
    const newRow = new Array(tableData.headers.length).fill("");
    onChange({ ...tableData, rows: [...tableData.rows, newRow] });
  };

  const removeRow = (index: number) => {
    if (tableData.rows.length <= 1) {
      alert("Debe haber al menos una fila");
      return;
    }
    const newRows = tableData.rows.filter((_, i) => i !== index);
    onChange({ ...tableData, rows: newRows });
  };

  const addColumn = () => {
    const newHeaders = [...tableData.headers, `Columna ${tableData.headers.length + 1}`];
    const newRows = tableData.rows.map(row => [...row, ""]);
    onChange({ headers: newHeaders, rows: newRows });
  };

  const removeColumn = (index: number) => {
    if (tableData.headers.length <= 1) {
      alert("Debe haber al menos una columna");
      return;
    }
    const newHeaders = tableData.headers.filter((_, i) => i !== index);
    const newRows = tableData.rows.map(row => row.filter((_, i) => i !== index));
    onChange({ headers: newHeaders, rows: newRows });
  };

  const handleImportFromExcel = () => {
    if (!importText.trim()) {
      alert("Por favor, pegá el contenido de Excel");
      return;
    }

    try {
      const lines = importText.trim().split("\n");
      if (lines.length < 2) {
        alert("Se necesitan al menos 2 líneas (encabezados + 1 fila de datos)");
        return;
      }

      // Primera línea = headers
      const headers = lines[0].split("\t").map(h => h.trim());

      // Resto = rows
      const rows = lines.slice(1).map(line => {
        const cells = line.split("\t").map(c => c.trim());
        // Asegurar que todas las filas tengan el mismo número de columnas
        while (cells.length < headers.length) {
          cells.push("");
        }
        return cells.slice(0, headers.length);
      });

      onChange({ headers, rows });
      setImportText("");
      setShowImport(false);
      alert("✅ Tabla importada correctamente");
    } catch (error) {
      alert("❌ Error al importar. Asegurate de copiar desde Excel con formato de tabla.");
      console.error(error);
    }
  };

  return (
    <div style={{
      border: "2px solid #2196f3",
      borderRadius: "8px",
      padding: "15px",
      background: "#f8f9fa"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "15px"
      }}>
        <h4 style={{ margin: 0, color: "#2196f3" }}>📊 Editor de Tabla</h4>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setShowImport(!showImport)}
            style={{
              padding: "6px 12px",
              background: "#ff9800",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px"
            }}
            title="Importar desde Excel"
          >
            📋 Pegar desde Excel
          </button>
          <button
            type="button"
            onClick={addColumn}
            style={{
              padding: "6px 12px",
              background: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px"
            }}
            title="Agregar columna"
          >
            + Columna
          </button>
          <button
            type="button"
            onClick={addRow}
            style={{
              padding: "6px 12px",
              background: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px"
            }}
            title="Agregar fila"
          >
            + Fila
          </button>
        </div>
      </div>

      {showImport && (
        <div style={{
          background: "#fff3e0",
          padding: "15px",
          borderRadius: "5px",
          marginBottom: "15px",
          border: "1px solid #ff9800"
        }}>
          <p style={{ margin: "0 0 10px 0", fontSize: "14px" }}>
            <strong>Cómo importar desde Excel:</strong>
          </p>
          <ol style={{ margin: "0 0 10px 0", paddingLeft: "20px", fontSize: "13px" }}>
            <li>Seleccioná la tabla en Excel (incluyendo encabezados)</li>
            <li>Copiá (Ctrl+C)</li>
            <li>Pegá abajo (Ctrl+V)</li>
            <li>Click en "Importar"</li>
          </ol>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Pegá aquí el contenido de Excel..."
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontFamily: "monospace",
              fontSize: "12px",
              resize: "vertical"
            }}
          />
          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={handleImportFromExcel}
              style={{
                padding: "8px 16px",
                background: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "bold"
              }}
            >
              ✓ Importar
            </button>
            <button
              type="button"
              onClick={() => {
                setShowImport(false);
                setImportText("");
              }}
              style={{
                padding: "8px 16px",
                background: "#999",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px"
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div style={{ overflow: "auto" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <thead>
            <tr>
              <th style={{
                background: "#2196f3",
                color: "white",
                padding: "8px",
                width: "40px",
                textAlign: "center"
              }}>
                #
              </th>
              {tableData.headers.map((header, colIndex) => (
                <th key={colIndex} style={{
                  background: "#2196f3",
                  color: "white",
                  padding: "8px",
                  position: "relative"
                }}>
                  <input
                    type="text"
                    value={header}
                    onChange={(e) => handleHeaderChange(colIndex, e.target.value)}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.2)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "3px",
                      fontSize: "13px",
                      fontWeight: "bold"
                    }}
                    placeholder={`Columna ${colIndex + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeColumn(colIndex)}
                    style={{
                      position: "absolute",
                      top: "2px",
                      right: "2px",
                      background: "#f44336",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                      fontSize: "10px",
                      padding: "2px 6px"
                    }}
                    title="Eliminar columna"
                  >
                    ×
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td style={{
                  background: "#f5f5f5",
                  padding: "8px",
                  textAlign: "center",
                  fontWeight: "bold",
                  color: "#666",
                  fontSize: "12px",
                  position: "relative"
                }}>
                  {rowIndex + 1}
                  <button
                    type="button"
                    onClick={() => removeRow(rowIndex)}
                    style={{
                      position: "absolute",
                      top: "2px",
                      right: "2px",
                      background: "#f44336",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                      fontSize: "10px",
                      padding: "2px 6px"
                    }}
                    title="Eliminar fila"
                  >
                    ×
                  </button>
                </td>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} style={{
                    border: "1px solid #ddd",
                    padding: "4px"
                  }}>
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      style={{
                        width: "100%",
                        border: "1px solid #e0e0e0",
                        padding: "6px 8px",
                        borderRadius: "3px",
                        fontSize: "13px"
                      }}
                      placeholder="..."
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        marginTop: "10px",
        padding: "8px",
        background: "#e3f2fd",
        borderRadius: "4px",
        fontSize: "12px",
        color: "#1976d2"
      }}>
        💡 <strong>Tip:</strong> Podés editar directamente las celdas, agregar/quitar filas y columnas,
        o importar desde Excel pegando el contenido copiado.
      </div>
    </div>
  );
}
