import { useState, useEffect } from "react";
import ChapterTree from "./components/ChapterTree";
import EditorForm from "./components/EditorForm";
import ConceptosTab from "./components/ConceptosTab";
import PDFViewer from "./components/PDFViewer";
import DiffModal from "./components/DiffModal";
import Toolbar from "./components/Toolbar";
import StatusFilterComponent from "./components/StatusFilter";
import ProgressTracker from "./components/ProgressTracker";
import CategorySelector from "./components/CategorySelector";
import DocumentSelector from "./components/DocumentSelector";
import TesaurosHub, { type TesaurosView } from "./components/TesaurosHub";
import Resizer from "./components/Resizer";
import { useDocStore } from "./state/useDocStore";
import { useAutosave, getAutosaveData, getCloudAutosave } from "./hooks/useAutosave";
import "./App.css";

type NavigationLevel = "category" | "document" | "editor" | "tesauros" | "tesauros-view";
type EditorTab = "editor" | "conceptos";

function App() {
  const { doc, setDoc, setOriginal, original, validationErrors, selected } = useDocStore();
  const [showDiff, setShowDiff] = useState(false);
  const [navigationLevel, setNavigationLevel] = useState<NavigationLevel>("category");
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null);
  const [selectedDocPath, setSelectedDocPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfSearchText, setPdfSearchText] = useState<string | undefined>(undefined);
  const { lastSaved, syncStatus, lastCloudSync } = useAutosave(30000); // Autosave cada 30 segundos

  // Estados para anchos de paneles redimensionables
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [pdfWidth, setPdfWidth] = useState(400);

  // Estado para el tab activo en el editor
  const [activeTab, setActiveTab] = useState<EditorTab>("editor");

  // Estado para detectar si estamos en modo validación de conceptos
  const [isValidationMode, setIsValidationMode] = useState(false);

  // Estado para gestión de tesauros
  const [activeTesaurosView, setActiveTesaurosView] = useState<TesaurosView | null>(null);

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

  const handleSelectCategory = (categoryId: string) => {
    // Detectar modo validación
    const isValidation = categoryId === "validacion-conceptos";
    setIsValidationMode(isValidation);

    // Si es modo validación, forzar el tab de conceptos
    if (isValidation) {
      setActiveTab("conceptos");
    } else {
      setActiveTab("editor");
    }

    // Mapeo de IDs a nombres
    const categoryNames: { [key: string]: string } = {
      "130-75": "CCT 130/75",
      "75": "CCT 75",
      "100": "CCT 100",
      "validacion-conceptos": "Validación de Conceptos"
    };

    setSelectedCategory({
      id: categoryId,
      name: categoryNames[categoryId] || categoryId
    });
    setNavigationLevel("document");
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setIsValidationMode(false);
    setActiveTesaurosView(null);
    setNavigationLevel("category");
  };

  const handleSelectTesauros = () => {
    setNavigationLevel("tesauros");
  };

  const handleSelectTesaurosView = (view: TesaurosView) => {
    setActiveTesaurosView(view);

    if (view === "validar") {
      // Ir al selector de documentos en modo validación
      setIsValidationMode(true);
      setSelectedCategory({
        id: "validacion-conceptos",
        name: "Validación de Conceptos"
      });
      setActiveTab("conceptos");
      setNavigationLevel("document");
    } else if (view === "editor") {
      // Ir al editor de tesauro
      setNavigationLevel("tesauros-view");
    } else if (view === "descargar") {
      // Descargar tesauro directamente
      handleDescargarTesauro();
      // Permanecer en el hub
    }
  };

  const handleBackToTesaurosHub = () => {
    setActiveTesaurosView(null);
    setNavigationLevel("tesauros");
  };

  const handleDescargarTesauro = async () => {
    try {
      const res = await fetch("/tesauro_convenios_colectivos.json");
      const tesauro = await res.json();

      const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const nombreArchivo = `tesauro_completo_${fecha}.json`;

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tesauro, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = dataStr;
      downloadAnchor.download = nombreArchivo;
      downloadAnchor.click();

      alert(
        `✅ Tesauro descargado exitosamente\n\n` +
        `Archivo: ${nombreArchivo}\n` +
        `Conceptos incluidos: ${tesauro.tesauro.conceptos.length}\n` +
        `Versión: ${tesauro.tesauro.version}\n` +
        `Última actualización: ${tesauro.tesauro.fecha_actualizacion}`
      );
    } catch (error) {
      console.error("Error al descargar tesauro:", error);
      alert("❌ Error al descargar el tesauro. Revisa la consola para más detalles.");
    }
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

      // Revisar AMBOS: autosave local Y cloud - ELEGIR EL MÁS RECIENTE
      const fileName = json.metadata.nombre_archivo;
      const localData = getAutosaveData(fileName);
      const cloudData = await getCloudAutosave(fileName);

      let documentToLoad = json;
      let source = 'original';
      let notificationMessage = '';

      // Comparar versiones
      if (localData && cloudData) {
        // Ambos existen - elegir el más reciente
        const localTime = localData.timestamp ? new Date(localData.timestamp).getTime() : 0;
        const cloudTime = cloudData.timestamp ? new Date(cloudData.timestamp).getTime() : 0;

        if (localTime > cloudTime) {
          // Local más reciente
          documentToLoad = localData.data;
          source = 'local';
          const timeAgo = Math.round((new Date().getTime() - localTime) / 60000);
          notificationMessage =
            `✅ Cargada versión LOCAL (más reciente)\n\n` +
            `Tu versión local es más nueva que la del servidor.\n` +
            `Guardada hace ${timeAgo} minuto${timeAgo !== 1 ? 's' : ''} en este navegador.\n\n` +
            `Se sincronizará automáticamente al servidor cada 30 segundos.`;
        } else {
          // Cloud más reciente
          documentToLoad = cloudData.data;
          source = 'cloud';
          const timeAgo = Math.round((new Date().getTime() - cloudTime) / 60000);
          notificationMessage =
            `☁️ Cargada versión del SERVIDOR (más reciente)\n\n` +
            `Última edición: ${cloudData.userName || 'Usuario'}\n` +
            `Hace ${timeAgo} minuto${timeAgo !== 1 ? 's' : ''}.\n\n` +
            `Esta versión fue guardada desde otra PC o usuario.\n` +
            `Tus cambios se sincronizarán automáticamente cada 30 segundos.`;
        }
      } else if (cloudData) {
        // Solo existe en cloud
        documentToLoad = cloudData.data;
        source = 'cloud';
        const cloudTime = cloudData.timestamp ? new Date(cloudData.timestamp).getTime() : new Date().getTime();
        const timeAgo = Math.round((new Date().getTime() - cloudTime) / 60000);
        notificationMessage =
          `☁️ Cargada versión del SERVIDOR\n\n` +
          `Última edición: ${cloudData.userName || 'Usuario'}\n` +
          `Hace ${timeAgo} minuto${timeAgo !== 1 ? 's' : ''}.\n\n` +
          `No había versión local en este navegador.\n` +
          `Ahora puedes continuar editando y se guardará automáticamente.`;
      } else if (localData) {
        // Solo existe local
        documentToLoad = localData.data;
        source = 'local';
        const localTime = localData.timestamp ? new Date(localData.timestamp).getTime() : new Date().getTime();
        const timeAgo = Math.round((new Date().getTime() - localTime) / 60000);
        notificationMessage =
          `✅ Cargada versión LOCAL\n\n` +
          `Guardada hace ${timeAgo} minuto${timeAgo !== 1 ? 's' : ''} en este navegador.\n\n` +
          `No se encontró versión en el servidor.\n` +
          `Se sincronizará automáticamente cada 30 segundos.`;
      } else {
        // No hay ninguna versión guardada - usar original
        notificationMessage =
          `📄 Cargada versión ORIGINAL del servidor\n\n` +
          `No se encontraron cambios previos guardados.\n` +
          `El guardado automático comenzará en 30 segundos.`;
      }

      console.log(`📂 Documento cargado desde: ${source}`);
      if (notificationMessage) {
        setTimeout(() => alert(notificationMessage), 500);
      }

      // Cargar el documento elegido
      console.log("Seteando documento en el store...");
      setDoc(documentToLoad);
      setOriginal(JSON.parse(JSON.stringify(json))); // Original siempre es el del servidor
      setSelectedDocPath(filePath);
      setNavigationLevel("editor");
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

  const handleBackToDocumentSelector = () => {
    // Advertencia fuerte y clara sobre el estado del documento
    let message = "⚠️ ¿VOLVER AL SELECTOR DE DOCUMENTOS?\n\n";

    if (lastSaved) {
      const minutosDesdeGuardado = Math.round((new Date().getTime() - lastSaved.getTime()) / 60000);
      message +=
        `✅ TUS CAMBIOS ESTÁN SEGUROS:\n` +
        `• Último guardado automático: hace ${minutosDesdeGuardado} minuto${minutosDesdeGuardado !== 1 ? 's' : ''}\n` +
        `• El respaldo se mantiene en el navegador\n` +
        `• Al volver a abrir este documento, continuarás donde quedaste\n\n` +
        `Recordá descargar el archivo final cuando termines de revisar todo el CCT.`;
    } else {
      message +=
        `⚠️ ATENCIÓN: NO HAY CAMBIOS GUARDADOS TODAVÍA\n\n` +
        `El guardado automático funciona cada 30 segundos.\n` +
        `Si volvés ahora, perderás cualquier cambio reciente.\n\n` +
        `¿Estás seguro de que querés salir?`;
    }

    if (confirm(message)) {
      setDoc(null);
      setOriginal(null);
      setSelectedDocPath(null);
      setNavigationLevel("document");
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

    // NO limpiar el autosave - mantener respaldo permanente para seguridad
    // El autosave se mantiene como respaldo adicional

    setShowDiff(false);

    alert(
      `✅ Documento guardado como: ${nombreArchivo}\n\n` +
      `Tu trabajo está seguro:\n` +
      `• Archivo descargado a tu PC\n` +
      `• Respaldo automático mantenido en el navegador\n` +
      `• Guardado automático cada 30 segundos activo`
    );
  };

  // Vista 1: Selector de categorías
  if (navigationLevel === "category") {
    return <CategorySelector onSelectCategory={handleSelectCategory} onSelectTesauros={handleSelectTesauros} />;
  }

  // Vista Tesauros Hub
  if (navigationLevel === "tesauros") {
    return <TesaurosHub onSelectView={handleSelectTesaurosView} onBack={handleBackToCategories} />;
  }

  // Vista específica de tesauros (por ahora solo editor)
  if (navigationLevel === "tesauros-view") {
    if (activeTesaurosView === "editor") {
      // TODO: Implementar EditorTesauro
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          padding: "40px"
        }}>
          <h1 style={{ fontSize: "32px", color: "#673ab7", marginBottom: "20px" }}>
            📚 Editor de Tesauro
          </h1>
          <p style={{ fontSize: "18px", color: "#666", marginBottom: "30px" }}>
            Próximamente: Interfaz para agregar y editar conceptos del diccionario
          </p>
          <button
            onClick={handleBackToTesaurosHub}
            style={{
              padding: "12px 24px",
              background: "#673ab7",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            ← Volver a Gestión de Tesauros
          </button>
        </div>
      );
    }
    return null;
  }

  // Vista 2: Selector de documentos
  if (navigationLevel === "document") {
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

    return (
      <DocumentSelector
        onSelectDocument={handleSelectDocument}
        categoryId={selectedCategory?.id}
        categoryName={selectedCategory?.name}
        onBack={handleBackToCategories}
        isValidationMode={isValidationMode}
      />
    );
  }

  // Vista 3: Editor (cuando hay documento cargado)
  if (!selectedDocPath || !doc) {
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

  // Si hay documento, mostrar editor
  return (
    <div className="app-container">
      <Toolbar
        onSave={handleSave}
        lastSaved={lastSaved}
        syncStatus={syncStatus}
        lastCloudSync={lastCloudSync}
      />

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
              onClick={handleBackToDocumentSelector}
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

        <main className="main-content" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Tabs del editor - ocultar tab Editor si estamos en modo validación */}
          {!isValidationMode && (
            <div style={{
              display: "flex",
              borderBottom: "2px solid #e0e0e0",
              background: "#f5f5f5"
            }}>
              <button
                onClick={() => setActiveTab("editor")}
                style={{
                  padding: "12px 24px",
                  background: activeTab === "editor" ? "white" : "transparent",
                  color: activeTab === "editor" ? "#2196f3" : "#666",
                  border: "none",
                  borderBottom: activeTab === "editor" ? "3px solid #2196f3" : "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                  transition: "all 0.2s"
                }}
              >
                📝 Editor
              </button>
              <button
                onClick={() => setActiveTab("conceptos")}
                style={{
                  padding: "12px 24px",
                  background: activeTab === "conceptos" ? "white" : "transparent",
                  color: activeTab === "conceptos" ? "#2196f3" : "#666",
                  border: "none",
                  borderBottom: activeTab === "conceptos" ? "3px solid #2196f3" : "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                  transition: "all 0.2s"
                }}
              >
                🔍 Conceptos (Tesauro)
              </button>
            </div>
          )}

          {/* Contenido del tab activo */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            {!isValidationMode && activeTab === "editor" && <EditorForm />}
            {activeTab === "conceptos" && <ConceptosTab />}
          </div>
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
