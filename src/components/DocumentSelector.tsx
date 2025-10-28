import { useState, useEffect } from "react";
import type { DocumentInfo } from "../lib/types";

interface DocumentSelectorProps {
  onSelectDocument: (filePath: string) => void;
}

export default function DocumentSelector({ onSelectDocument }: DocumentSelectorProps) {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Cargar la lista de documentos disponibles
    // Por ahora, usamos una lista hardcodeada de los 18 documentos
    // En producción, esto vendría de un endpoint que lista los archivos
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

    setDocuments(availableDocs);
    setLoading(false);
  }, []);

  const filteredDocs = documents.filter((doc) =>
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tipo_documento.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "40px 20px",
      height: "100vh",
      overflow: "auto",
      boxSizing: "border-box"
    }}>
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{
          fontSize: "28px",
          marginBottom: "10px",
          color: "#333"
        }}>
          Editor de CCT - Seleccionar Documento
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
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        gap: "20px"
      }}>
        {filteredDocs.map((doc) => (
          <div
            key={doc.filePath}
            onClick={() => onSelectDocument(doc.filePath)}
            style={{
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s",
              backgroundColor: "#fff"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#2196f3";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#ddd";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{
              fontSize: "14px",
              fontWeight: "bold",
              marginBottom: "10px",
              color: "#333",
              wordBreak: "break-word"
            }}>
              {doc.fileName.replace("_HIBRIDO.json", "")}
            </div>

            <div style={{ fontSize: "13px", color: "#666", marginBottom: "5px" }}>
              <strong>Tipo:</strong> {doc.tipo_documento}
            </div>

            <div style={{ fontSize: "13px", color: "#666" }}>
              <strong>Parseado:</strong> {doc.fecha_parseo}
            </div>

            <div style={{
              marginTop: "15px",
              textAlign: "right",
              fontSize: "14px",
              color: "#2196f3",
              fontWeight: "500"
            }}>
              Abrir →
            </div>
          </div>
        ))}
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
      </div>
    </div>
  );
}
