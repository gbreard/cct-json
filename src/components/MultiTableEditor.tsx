import { useState } from "react";
import TableEditor, { type TableData } from "./TableEditor";
import type { TablaEditableExtendida, TablaEditable } from "../lib/types";

interface MultiTableEditorProps {
  // Soporte para ambos formatos (retrocompatibilidad)
  value?: TablaEditable; // Formato antiguo (una sola tabla)
  values?: TablaEditableExtendida[]; // Formato nuevo (múltiples tablas)
  onChange: (tablas: TablaEditableExtendida[]) => void;
}

export default function MultiTableEditor({ value, values, onChange }: MultiTableEditorProps) {
  // Convertir formato antiguo a nuevo si es necesario (retrocompatibilidad)
  const getTablas = (): TablaEditableExtendida[] => {
    if (values && values.length > 0) {
      return values;
    }
    if (value) {
      // Migrar formato antiguo → nuevo
      return [{
        id: `tabla_${Date.now()}`,
        titulo: "",
        headers: value.headers,
        rows: value.rows,
        nota_al_pie: ""
      }];
    }
    return [];
  };

  const [tablas, setTablas] = useState<TablaEditableExtendida[]>(getTablas());
  const [tablaExpandida, setTablaExpandida] = useState<string | null>(null);

  const handleChange = (nuevasTablas: TablaEditableExtendida[]) => {
    setTablas(nuevasTablas);
    onChange(nuevasTablas);
  };

  const agregarTabla = () => {
    const nuevaTabla: TablaEditableExtendida = {
      id: `tabla_${Date.now()}`,
      titulo: `Tabla ${tablas.length + 1}`,
      headers: ["Columna 1", "Columna 2"],
      rows: [["", ""]],
      nota_al_pie: ""
    };
    handleChange([...tablas, nuevaTabla]);
    setTablaExpandida(nuevaTabla.id);
  };

  const eliminarTabla = (id: string) => {
    if (tablas.length <= 1) {
      if (!confirm("¿Estás seguro de eliminar la única tabla? Esto desmarcará 'contiene tabla'.")) {
        return;
      }
    }
    handleChange(tablas.filter(t => t.id !== id));
    if (tablaExpandida === id) {
      setTablaExpandida(null);
    }
  };

  const actualizarTabla = (id: string, cambios: Partial<TablaEditableExtendida>) => {
    handleChange(tablas.map(t => t.id === id ? { ...t, ...cambios } : t));
  };

  const moverTabla = (index: number, direccion: 'arriba' | 'abajo') => {
    if (
      (direccion === 'arriba' && index === 0) ||
      (direccion === 'abajo' && index === tablas.length - 1)
    ) {
      return;
    }

    const nuevasTablas = [...tablas];
    const nuevoIndex = direccion === 'arriba' ? index - 1 : index + 1;
    [nuevasTablas[index], nuevasTablas[nuevoIndex]] = [nuevasTablas[nuevoIndex], nuevasTablas[index]];
    handleChange(nuevasTablas);
  };

  return (
    <div style={{
      border: "2px solid #4caf50",
      borderRadius: "8px",
      padding: "20px",
      background: "#f9fff9"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px"
      }}>
        <h3 style={{ margin: 0, color: "#4caf50" }}>
          📊 Tablas ({tablas.length})
        </h3>
        <button
          onClick={agregarTabla}
          style={{
            padding: "8px 16px",
            background: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px"
          }}
        >
          + Agregar Tabla
        </button>
      </div>

      {tablas.length === 0 ? (
        <div style={{
          padding: "40px",
          textAlign: "center",
          color: "#999",
          background: "#f5f5f5",
          borderRadius: "6px"
        }}>
          No hay tablas. Haz clic en "Agregar Tabla" para crear una.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {tablas.map((tabla, index) => (
            <div
              key={tabla.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "6px",
                background: "white",
                overflow: "hidden"
              }}
            >
              {/* Header de la tabla */}
              <div
                onClick={() => setTablaExpandida(tablaExpandida === tabla.id ? null : tabla.id)}
                style={{
                  padding: "15px",
                  background: "#f5f5f5",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  userSelect: "none"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "18px" }}>
                    {tablaExpandida === tabla.id ? "▼" : "▶"}
                  </span>
                  <strong>
                    {tabla.titulo || `Tabla ${index + 1}`}
                  </strong>
                  <span style={{ color: "#999", fontSize: "13px" }}>
                    ({tabla.headers.length} columnas, {tabla.rows.length} filas)
                  </span>
                </div>

                <div style={{ display: "flex", gap: "5px" }} onClick={(e) => e.stopPropagation()}>
                  {index > 0 && (
                    <button
                      onClick={() => moverTabla(index, 'arriba')}
                      style={{
                        padding: "4px 8px",
                        background: "#2196f3",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                      title="Mover arriba"
                    >
                      ↑
                    </button>
                  )}
                  {index < tablas.length - 1 && (
                    <button
                      onClick={() => moverTabla(index, 'abajo')}
                      style={{
                        padding: "4px 8px",
                        background: "#2196f3",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                      title="Mover abajo"
                    >
                      ↓
                    </button>
                  )}
                  <button
                    onClick={() => eliminarTabla(tabla.id)}
                    style={{
                      padding: "4px 8px",
                      background: "#f44336",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>

              {/* Contenido expandido */}
              {tablaExpandida === tabla.id && (
                <div style={{ padding: "20px" }}>
                  {/* Título de la tabla */}
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                      Título de la tabla:
                    </label>
                    <input
                      type="text"
                      value={tabla.titulo || ""}
                      onChange={(e) => actualizarTabla(tabla.id, { titulo: e.target.value })}
                      placeholder="Ej: Escalafón salarial 2024"
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "14px"
                      }}
                    />
                  </div>

                  {/* Editor de tabla */}
                  <TableEditor
                    value={{ headers: tabla.headers, rows: tabla.rows }}
                    onChange={(tableData: TableData) => {
                      actualizarTabla(tabla.id, {
                        headers: tableData.headers,
                        rows: tableData.rows
                      });
                    }}
                  />

                  {/* Nota al pie */}
                  <div style={{ marginTop: "15px" }}>
                    <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
                      Nota al pie (opcional):
                    </label>
                    <textarea
                      value={tabla.nota_al_pie || ""}
                      onChange={(e) => actualizarTabla(tabla.id, { nota_al_pie: e.target.value })}
                      placeholder="Ej: Valores vigentes desde enero 2024..."
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontFamily: "inherit",
                        resize: "vertical"
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
