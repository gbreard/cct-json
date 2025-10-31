import { useState, useEffect } from "react";
import type { DocumentInfo, CCTDocument } from "../lib/types";
import { getSavedData } from "../hooks/useAutosave";
import { calculateProgress, getEstadoLabel, getEstadoColor, type ProgressStats } from "../lib/progressCalculator";

interface DocumentSelectorProps {
  onSelectDocument: (filePath: string) => void;
  categoryId?: string;
  categoryName?: string;
  onBack?: () => void;
  isValidationMode?: boolean;
}

interface DocumentWithProgress extends DocumentInfo {
  progress?: ProgressStats;
  lastEdited?: Date | null;
  editedBy?: string;
}

export default function DocumentSelector({ onSelectDocument, categoryId, categoryName, onBack, isValidationMode }: DocumentSelectorProps) {
  const [documents, setDocuments] = useState<DocumentWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    // Cargar la lista de documentos disponibles
    const availableDocs: DocumentInfo[] = [
      {
        fileName: "CCT-130-75-Principal_02_0CCADB83_HIBRIDO.json",
        filePath: "/jsons_parseados/CCT-130-75-Principal_02_0CCADB83_HIBRIDO.json",
        tipo_documento: "CCT_PRINCIPAL",
        fecha_parseo: "2025-10-16"
      },
      {
        fileName: "CCT-130-75-Principal-1_HIBRIDO.json",
        filePath: "/jsons_parseados/CCT-130-75-Principal-1_HIBRIDO.json",
        tipo_documento: "CCT_PRINCIPAL",
        fecha_parseo: "2025-10-16"
      },
      {
        fileName: "CCT-130-75-Principal_01_7527588E_HIBRIDO.json",
        filePath: "/jsons_parseados/CCT-130-75-Principal_01_7527588E_HIBRIDO.json",
        tipo_documento: "CCT_PRINCIPAL",
        fecha_parseo: "2025-10-16"
      },
      {
        fileName: "CCT-130-75-Principal-2_HIBRIDO.json",
        filePath: "/jsons_parseados/CCT-130-75-Principal-2_HIBRIDO.json",
        tipo_documento: "CCT_PRINCIPAL",
        fecha_parseo: "2025-10-16"
      },
      {
        fileName: "CON-ACU-1130-2011-A_HIBRIDO.json",
        filePath: "/jsons_parseados/CON-ACU-1130-2011-A_HIBRIDO.json",
        tipo_documento: "ACUERDO",
        fecha_parseo: "2025-10-22"
      },
      {
        fileName: "CON-ACU-130-2010-E_HIBRIDO.json",
        filePath: "/jsons_parseados/CON-ACU-130-2010-E_HIBRIDO.json",
        tipo_documento: "ACUERDO",
        fecha_parseo: "2025-10-22"
      },
      {
        fileName: "CON-ACU-130-2013-A_HIBRIDO.json",
        filePath: "/jsons_parseados/CON-ACU-130-2013-A_HIBRIDO.json",
        tipo_documento: "ACUERDO",
        fecha_parseo: "2025-10-22"
      },
      {
        fileName: "CON-ACU-130-2019-E_1_HIBRIDO.json",
        filePath: "/jsons_parseados/CON-ACU-130-2019-E_1_HIBRIDO.json",
        tipo_documento: "ACUERDO",
        fecha_parseo: "2025-10-22"
      },
      {
        fileName: "CON-ACU-130-2024-E_1_HIBRIDO.json",
        filePath: "/jsons_parseados/CON-ACU-130-2024-E_1_HIBRIDO.json",
        tipo_documento: "ACUERDO",
        fecha_parseo: "2025-10-22"
      },
      {
        fileName: "CON-CCT-130-1975-A_HIBRIDO.json",
        filePath: "/jsons_parseados/CON-CCT-130-1975-A_HIBRIDO.json",
        tipo_documento: "CCT",
        fecha_parseo: "2025-10-22"
      },
      {
        fileName: "HOM-CCT-1130-2010-E_HIBRIDO.json",
        filePath: "/jsons_parseados/HOM-CCT-1130-2010-E_HIBRIDO.json",
        tipo_documento: "CCT_HOMOLOGADO",
        fecha_parseo: "2025-10-22"
      },
      {
        fileName: "HOM-CCT-130-1990-A_HIBRIDO.json",
        filePath: "/jsons_parseados/HOM-CCT-130-1990-A_HIBRIDO.json",
        tipo_documento: "CCT_HOMOLOGADO",
        fecha_parseo: "2025-10-22"
      },
      {
        fileName: "HOM-CCT-130-1975-A_HIBRIDO.json",
        filePath: "/jsons_parseados/HOM-CCT-130-1975-A_HIBRIDO.json",
        tipo_documento: "CCT_HOMOLOGADO",
        fecha_parseo: "2025-10-22"
      },
      {
        fileName: "INFO-ACU-130-2010-E_HIBRIDO.json",
        filePath: "/jsons_parseados/INFO-ACU-130-2010-E_HIBRIDO.json",
        tipo_documento: "INFO",
        fecha_parseo: "2025-10-22"
      },
      {
        fileName: "INFO-ACU-130-2013-A_HIBRIDO.json",
        filePath: "/jsons_parseados/INFO-ACU-130-2013-A_HIBRIDO.json",
        tipo_documento: "INFO",
        fecha_parseo: "2025-10-22"
      },
      {
        fileName: "INFO-CCT-130-1975-A_HIBRIDO.json",
        filePath: "/jsons_parseados/INFO-CCT-130-1975-A_HIBRIDO.json",
        tipo_documento: "INFO",
        fecha_parseo: "2025-10-22"
      },
      {
        fileName: "INFO2-ACU-130-2010-E_HIBRIDO.json",
        filePath: "/jsons_parseados/INFO2-ACU-130-2010-E_HIBRIDO.json",
        tipo_documento: "INFO",
        fecha_parseo: "2025-10-22"
      },
      {
        fileName: "INFO3-CCT-130-1975-A_HIBRIDO.json",
        filePath: "/jsons_parseados/INFO3-CCT-130-1975-A_HIBRIDO.json",
        tipo_documento: "INFO",
        fecha_parseo: "2025-10-22"
      }
    ];

    // Filtrar documentos por categoría si se especifica
    let filteredByCategory = availableDocs;
    if (categoryId) {
      // Mapeo de categoryId a patrón de búsqueda
      const categoryPatterns: { [key: string]: RegExp } = {
        "130-75": /130/i,  // Busca "130" en el nombre del archivo
        "75": /^75-/i,      // Busca que empiece con "75-"
        "100": /^100-/i     // Busca que empiece con "100-"
      };

      const pattern = categoryPatterns[categoryId];
      if (pattern) {
        filteredByCategory = availableDocs.filter(doc => pattern.test(doc.fileName));
      }
    }

    setDocuments(filteredByCategory);
    setLoading(false);

    // Cargar progreso de cada documento en paralelo
    loadAllProgress(filteredByCategory);
  }, [categoryId, isValidationMode]);

  const loadAllProgress = async (docs: DocumentInfo[]) => {
    setLoadingProgress(true);

    const docsWithProgress = await Promise.all(
      docs.map(async (doc) => {
        try {
          const baseFileName = doc.fileName.replace("_HIBRIDO.json", "");

          // Intentar cargar desde servidor (ÚNICA FUENTE DE DATOS)
          const savedData = await getSavedData(baseFileName);

          // Usar datos guardados si existen
          let documentData: CCTDocument | null = null;
          let lastEdited: Date | null = null;
          let editedBy: string | undefined = undefined;

          if (savedData) {
            documentData = savedData.data;
            lastEdited = savedData.timestamp ? new Date(savedData.timestamp) : null;
            editedBy = savedData.userName;
          }

          // Calcular progreso si hay datos
          const progress = documentData ? calculateProgress(documentData) : undefined;

          return {
            ...doc,
            progress,
            lastEdited,
            editedBy
          };
        } catch (error) {
          console.error(`Error loading progress for ${doc.fileName}:`, error);
          return {
            ...doc,
            progress: undefined,
            lastEdited: null,
            editedBy: undefined
          };
        }
      })
    );

    // Si estamos en modo validación, filtrar solo documentos terminados
    const finalDocs = isValidationMode
      ? docsWithProgress.filter(doc => doc.progress?.estadoManual === "terminado")
      : docsWithProgress;

    setDocuments(finalDocs);
    setLoadingProgress(false);
  };

  const filteredDocs = documents.filter((doc) =>
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tipo_documento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderProgressBar = (porcentaje: number) => {
    const filled = Math.floor(porcentaje / 10);
    const empty = 10 - filled;
    return "█".repeat(filled) + "░".repeat(empty);
  };

  const formatTimeAgo = (date: Date | null | undefined): string => {
    if (!date) return "Nunca";

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "hace un momento";
    if (minutes < 60) return `hace ${minutes} min`;
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${days}d`;
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "18px",
        color: "#666"
      }}>
        Cargando lista de documentos...
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: "1400px",
      margin: "0 auto",
      padding: "40px 20px",
      height: "100vh",
      overflow: "auto",
      boxSizing: "border-box"
    }}>
      <div style={{ marginBottom: "30px" }}>
        {/* Botón volver a categorías */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              marginBottom: "20px",
              padding: "10px 20px",
              background: "#666",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#555"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#666"}
          >
            ← Volver a Categorías
          </button>
        )}

        <h1 style={{
          fontSize: "28px",
          marginBottom: "10px",
          color: "#333"
        }}>
          {categoryName ? `${categoryName} - Documentos` : "Editor de CCT - Seleccionar Documento"}
        </h1>
        <p style={{
          fontSize: "16px",
          color: "#666",
          marginBottom: "20px"
        }}>
          Selecciona un documento para comenzar la revisión y corrección
        </p>

        <input
          type="text"
          placeholder="Buscar por nombre o tipo de documento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            boxSizing: "border-box"
          }}
        />

        {loadingProgress && (
          <div style={{
            marginTop: "15px",
            padding: "10px",
            background: "#e3f2fd",
            borderRadius: "5px",
            fontSize: "14px",
            color: "#1976d2"
          }}>
            ⏳ Cargando progreso de documentos...
          </div>
        )}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(450px, 1fr))",
        gap: "20px"
      }}>
        {filteredDocs.map((doc) => {
          const progress = doc.progress;
          const hasProgress = progress && progress.totalElementos > 0;

          return (
            <div
              key={doc.filePath}
              onClick={() => onSelectDocument(doc.filePath)}
              style={{
                padding: "20px",
                border: "2px solid #ddd",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: "#fff"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#2196f3";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#ddd";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Header */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "15px"
              }}>
                <div style={{
                  fontSize: "15px",
                  fontWeight: "bold",
                  color: "#333",
                  wordBreak: "break-word",
                  flex: 1
                }}>
                  {doc.fileName.replace("_HIBRIDO.json", "")}
                </div>

                {hasProgress && (
                  <div style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    backgroundColor: getEstadoColor(progress.estadoManual) + "20",
                    color: getEstadoColor(progress.estadoManual),
                    whiteSpace: "nowrap",
                    marginLeft: "10px"
                  }}>
                    {getEstadoLabel(progress.estadoManual)}
                  </div>
                )}
              </div>

              {/* Progress Bar and Stats */}
              {hasProgress ? (
                <>
                  <div style={{
                    fontSize: "20px",
                    fontFamily: "monospace",
                    marginBottom: "8px",
                    letterSpacing: "1px",
                    color: progress.porcentajeRevisado === 100 ? "#4caf50" : "#666"
                  }}>
                    {renderProgressBar(progress.porcentajeRevisado)} {progress.porcentajeRevisado}%
                  </div>

                  <div style={{
                    fontSize: "13px",
                    color: "#666",
                    marginBottom: "12px",
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap"
                  }}>
                    <span>✅ {progress.elementosOK} OK</span>
                    {progress.elementosDuda > 0 && <span>🟡 {progress.elementosDuda} Duda</span>}
                    {progress.elementosCorregir > 0 && <span>⚠️ {progress.elementosCorregir} Corregir</span>}
                    <span>⚪ {progress.elementosPendientes} Pendientes</span>
                  </div>

                  <div style={{
                    fontSize: "12px",
                    color: "#999",
                    marginBottom: "10px"
                  }}>
                    📊 {progress.totalElementos} elementos totales
                    {progress.desglose.articulos.total > 0 && (
                      <span> • {progress.desglose.articulos.total} art.</span>
                    )}
                    {progress.desglose.incisos.total > 0 && (
                      <span> • {progress.desglose.incisos.total} incisos</span>
                    )}
                    {progress.desglose.clausulas.total > 0 && (
                      <span> • {progress.desglose.clausulas.total} cláus.</span>
                    )}
                  </div>

                  {progress.estadoManual === "terminado" && progress.totalElementos > 0 && (
                    <div style={{
                      padding: "8px 12px",
                      background: "#e8f5e9",
                      borderRadius: "5px",
                      fontSize: "12px",
                      color: "#2e7d32",
                      marginBottom: "10px"
                    }}>
                      ✓ Marcado como terminado
                      {doc.lastEdited && ` el ${doc.lastEdited.toLocaleDateString()}`}
                      {doc.editedBy && ` por ${doc.editedBy}`}
                    </div>
                  )}

                  {doc.lastEdited && (
                    <div style={{
                      fontSize: "12px",
                      color: "#999"
                    }}>
                      🕒 Última edición: {formatTimeAgo(doc.lastEdited)}
                      {doc.editedBy && ` por ${doc.editedBy}`}
                    </div>
                  )}
                </>
              ) : (
                <div style={{
                  padding: "15px",
                  background: "#f5f5f5",
                  borderRadius: "5px",
                  fontSize: "13px",
                  color: "#999",
                  marginBottom: "10px"
                }}>
                  ⚪ Sin revisión iniciada
                  <br />
                  <span style={{ fontSize: "12px" }}>
                    Click para comenzar a revisar este documento
                  </span>
                </div>
              )}

              {/* Footer */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "15px",
                paddingTop: "12px",
                borderTop: "1px solid #eee"
              }}>
                <div style={{ fontSize: "12px", color: "#999" }}>
                  <strong>Tipo:</strong> {doc.tipo_documento}
                </div>
                <div style={{
                  fontSize: "14px",
                  color: "#2196f3",
                  fontWeight: "500"
                }}>
                  Abrir →
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDocs.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "40px",
          color: "#999",
          fontSize: "16px"
        }}>
          No se encontraron documentos que coincidan con la búsqueda
        </div>
      )}

      <div style={{
        marginTop: "40px",
        padding: "20px",
        backgroundColor: "#f5f5f5",
        borderRadius: "8px",
        fontSize: "14px",
        color: "#666"
      }}>
        <strong>Total de documentos:</strong> {documents.length} | <strong>Mostrando:</strong> {filteredDocs.length}
        {!loadingProgress && (
          <>
            {" "}| <strong>Con progreso:</strong> {documents.filter(d => d.progress && d.progress.totalElementos > 0).length}
            {" "}| <strong>Terminados:</strong> {documents.filter(d => d.progress?.estadoManual === "terminado").length}
          </>
        )}
      </div>
    </div>
  );
}
