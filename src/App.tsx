import { useState, useEffect } from "react";
import ChapterTree from "./components/ChapterTree";
import EditorForm from "./components/EditorForm";
import PDFViewer from "./components/PDFViewer";
import DiffModal from "./components/DiffModal";
import Toolbar from "./components/Toolbar";
import StatusFilterComponent from "./components/StatusFilter";
import ProgressTracker from "./components/ProgressTracker";
import DocumentSelector from "./components/DocumentSelector";
import Resizer from "./components/Resizer";
import { useDocStore } from "./state/useDocStore";
import { useAutosave, getAutosaveData, clearAutosave } from "./hooks/useAutosave";
import "./App.css";

function App() {
  const { doc, setDoc, setOriginal, original, validationErrors, selected } = useDocStore();
  const [showDiff, setShowDiff] = useState(false);
  const [selectedDocPath, setSelectedDocPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfSearchText, setPdfSearchText] = useState<string | undefined>(undefined);
  const { lastSaved, isSaving } = useAutosave(30000); // Autosave cada 30 segundos

  // Estados para anchos de paneles redimensionables
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [pdfWidth, setPdfWidth] = useState(400);

  // Efecto para extraer contenido del elemento seleccionado y buscarlo en el PDF
  useEffect(() => {
    if (!doc || !selected) {
      setPdfSearchText(undefined);
      return;
    }

    let content = "";

    try {
      // Extraer contenido según el tipo de elemento seleccionado
      if (selected.type === "preambulo") {
        content = doc.estructura.preambulo || "";
      } else if (selected.type === "articulo" && selected.capIndex !== undefined && selected.artIndex !== undefined) {
        const articulo = doc.estructura.capitulos?.[selected.capIndex]?.articulos[selected.artIndex];
        content = articulo?.contenido || "";
      } else if (selected.type === "clausula" && selected.clausIndex !== undefined) {
        const clausula = doc.estructura.clausulas?.[selected.clausIndex];
        content = clausula?.contenido || "";
      } else if (selected.type === "anexo" && selected.anexoIndex !== undefined) {
        const anexo = doc.estructura.anexos?.[selected.anexoIndex];
        content = anexo?.contenido || "";
      } else if (selected.type === "seccion_personalizada" && selected.seccionIndex !== undefined) {
        const seccion = doc.estructura.secciones_personalizadas?.[selected.seccionIndex];
        content = seccion?.contenido || "";
      } else if (selected.type === "capitulo" && selected.capIndex !== undefined) {
        const capitulo = doc.estructura.capitulos?.[selected.capIndex];
        content = capitulo?.titulo || "";
      }

      // Solo buscar si hay contenido suficiente
      if (content && content.length >= 20) {
        setPdfSearchText(content);
      } else {
        setPdfSearchText(undefined);
      }
    } catch (error) {
      console.error("Error extracting content for PDF search:", error);
      setPdfSearchText(undefined);
    }
  }, [doc, selected]);

  // Generar ruta del PDF basada en el nombre del archivo
  const getPdfPath = () => {
    if (!doc?.metadata?.nombre_archivo) return undefined;

    // Remover el sufijo _HIBRIDO si existe y agregar extensión .pdf
    const pdfName = doc.metadata.nombre_archivo.replace(/_HIBRIDO$/i, '') + '.pdf';

    // La ruta del PDF está en /pdfs/
    return `/pdfs/${pdfName}`;
  };

  const handleSelectDocument = async (filePath: string) => {
    console.log("Intentando cargar documento:", filePath);
    setLoading(true);
    try {
      console.log("Haciendo fetch a:", filePath);
      const res = await fetch(filePath);
      console.log("Respuesta fetch:", res.status, res.statusText);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: No se pudo cargar ${filePath}`);
      }

      const json = await res.json();
      console.log("JSON parseado correctamente:", json);
      console.log("Metadata del documento:", json.metadata);
      console.log("Estructura:", json.estructura);

      // Validar estructura básica
      if (!json.metadata || !json.estructura) {
        throw new Error("El documento no tiene la estructura esperada (falta metadata o estructura)");
      }

      // Revisar si hay autosave guardado
      const fileName = json.metadata.nombre_archivo;
      const autosaveData = getAutosaveData(fileName);

      let documentToLoad = json;

      if (autosaveData && autosaveData.timestamp) {
        // Hay autosave guardado - preguntar al usuario
        const savedDate = new Date(autosaveData.timestamp);
        const timeAgo = Math.round((new Date().getTime() - savedDate.getTime()) / 60000); // minutos

        const shouldRestore = confirm(
          `📦 Hay cambios guardados automáticamente de este documento.\n\n` +
          `Guardado hace ${timeAgo} minuto${timeAgo !== 1 ? 's' : ''}.\n\n` +
          `¿Querés recuperar los cambios guardados?\n\n` +
          `• SÍ: Cargar la versión con tus cambios\n` +
          `• NO: Cargar la versión original (perderás los cambios)`
        );

        if (shouldRestore) {
          console.log("Restaurando desde autosave...");
          documentToLoad = autosaveData.data;
        } else {
          console.log("Usuario eligió NO restaurar autosave");
        }
      }

      // Cargar el documento elegido
      console.log("Seteando documento en el store...");
      setDoc(documentToLoad);
      setOriginal(JSON.parse(JSON.stringify(json))); // Original siempre es el del servidor
      setSelectedDocPath(filePath);
      console.log("Documento cargado exitosamente!");
    } catch (error) {
      console.error("ERROR completo:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      alert(
        `No se pudo cargar el documento.\n\nError: ${errorMsg}\n\nRevisa la consola del navegador (F12) para más detalles.`
      );
      setLoading(false);
      setDoc(null);
      setSelectedDocPath(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSelector = () => {
    const message = lastSaved
      ? "¿Volver al selector?\n\nTus cambios están guardados automáticamente y podrás recuperarlos al volver a abrir este documento."
      : "¿Volver al selector?\n\nNo se han guardado cambios automáticamente todavía.";

    if (confirm(message)) {
      setDoc(null);
      setOriginal(null);
      setSelectedDocPath(null);
    }
  };

  const handleSave = () => {
    if (!doc) return;

    // Validación básica
    if (!doc.metadata || !doc.estructura) {
      alert("❌ El documento no tiene la estructura correcta.");
      return;
    }

    // Mostrar modal de diff
    setShowDiff(true);
  };

  const handleConfirmSave = () => {
    if (!doc) return;

    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const nombreBase = doc.metadata.nombre_archivo || "documento";
    const nombreArchivo = `${nombreBase}_editado_${fecha}.json`;

    // Descargar el JSON
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(doc, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = dataStr;
    downloadAnchor.download = nombreArchivo;
    downloadAnchor.click();

    // Actualizar el original con el nuevo documento guardado
    setOriginal(JSON.parse(JSON.stringify(doc)));

    // Limpiar el autosave ya que el usuario descargó el archivo
    clearAutosave(nombreBase);

    setShowDiff(false);

    alert(`✅ Documento guardado como: ${nombreArchivo}\n\nEl guardado automático se ha limpiado.`);
  };

  // Si no hay documento seleccionado, mostrar selector
  if (!selectedDocPath || !doc) {
    if (loading) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            fontSize: "18px",
            color: "#666"
          }}
        >
          Cargando documento...
        </div>
      );
    }

    return <DocumentSelector onSelectDocument={handleSelectDocument} />;
  }

  // Si hay documento, mostrar editor
  return (
    <div className="app-container">
      <Toolbar onSave={handleSave} lastSaved={lastSaved} isSaving={isSaving} />

      <div style={{
        padding: "10px 20px",
        background: "#f5f5f5",
        borderBottom: "1px solid #ddd"
      }}>
        <StatusFilterComponent />
      </div>

      <ProgressTracker />

      {validationErrors.length > 0 && (
        <div
          style={{
            padding: "10px 20px",
            background: "#ffebee",
            borderBottom: "1px solid #f44336",
            color: "#c62828"
          }}
        >
          <strong>❌ Errores de validación:</strong>
          <ul style={{ margin: "10px 0", paddingLeft: "20px" }}>
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="app-layout">
        <aside className="sidebar" style={{ width: `${sidebarWidth}px` }}>
          <div style={{
            padding: "10px",
            borderBottom: "1px solid #ddd",
            background: "#f5f5f5"
          }}>
            <button
              onClick={handleBackToSelector}
              style={{
                padding: "8px 12px",
                background: "#666",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
                width: "100%"
              }}
            >
              ← Volver al selector
            </button>
            <div style={{
              marginTop: "10px",
              fontSize: "12px",
              color: "#666",
              wordBreak: "break-word"
            }}>
              <strong>Documento:</strong><br />
              {doc.metadata.nombre_archivo}
            </div>
          </div>
          <ChapterTree />
        </aside>

        <Resizer onResize={(deltaX) => setSidebarWidth(prev => Math.max(200, Math.min(600, prev + deltaX)))} />

        <main className="main-content">
          <EditorForm />
        </main>

        <Resizer onResize={(deltaX) => setPdfWidth(prev => Math.max(250, Math.min(800, prev - deltaX)))} />

        <section className="pdf-viewer" style={{ width: `${pdfWidth}px` }}>
          <PDFViewer pdfPath={getPdfPath()} searchText={pdfSearchText} />
        </section>
      </div>

      <DiffModal
        open={showDiff}
        before={original}
        after={doc}
        onClose={() => setShowDiff(false)}
        onConfirm={handleConfirmSave}
      />
    </div>
  );
}

export default App;
