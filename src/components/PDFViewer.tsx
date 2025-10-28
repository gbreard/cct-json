import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { PDFDocumentProxy } from 'pdfjs-dist';
import 'react-pdf/dist/Page/TextLayer.css';

// Configurar worker de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  pdfPath?: string;
  searchText?: string; // Texto a buscar en el PDF
}

export default function PDFViewer({ pdfPath, searchText }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const pdfDocumentRef = useRef<PDFDocumentProxy | null>(null);

  function onDocumentLoadSuccess(pdf: PDFDocumentProxy) {
    setNumPages(pdf.numPages);
    setPdfError(null);
    pdfDocumentRef.current = pdf;
  }

  function onDocumentLoadError(error: Error) {
    console.error("Error loading PDF:", error);
    setPdfError("PDF no disponible. Coloca el archivo PDF correspondiente en la carpeta public/ con el nombre cct.pdf");
  }

  // Función para buscar texto en el PDF
  const searchInPDF = async (textToFind: string) => {
    if (!pdfDocumentRef.current || !textToFind || textToFind.length < 10) {
      return;
    }

    setIsSearching(true);
    setSearchResult(null);

    try {
      const pdf = pdfDocumentRef.current;

      // Limpiar el texto de búsqueda (quitar saltos de línea excesivos y normalizar espacios)
      const cleanSearchText = textToFind
        .substring(0, 300) // Primeros 300 caracteres
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim()
        .toLowerCase();

      // Buscar en cada página
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Extraer todo el texto de la página
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .toLowerCase();

        // Verificar si el texto está en esta página
        if (pageText.includes(cleanSearchText.substring(0, 100))) {
          setPageNumber(i);
          setSearchResult(`✓ Encontrado en página ${i}`);
          setIsSearching(false);
          return;
        }
      }

      // No se encontró
      setSearchResult(`⚠ No se encontró el texto en el PDF`);
      setIsSearching(false);
    } catch (error) {
      console.error("Error searching in PDF:", error);
      setSearchResult(`❌ Error en la búsqueda`);
      setIsSearching(false);
    }
  };

  // Efecto para buscar cuando cambia el searchText
  useEffect(() => {
    if (searchText && pdfDocumentRef.current) {
      searchInPDF(searchText);
    }
  }, [searchText]);

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages || 1, prev + 1));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#525252" }}>
      <div
        style={{
          padding: "10px",
          background: "#424242",
          color: "white",
          display: "flex",
          gap: "10px",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap"
        }}
      >
        {/* Indicador de búsqueda */}
        {(isSearching || searchResult) && (
          <div
            style={{
              position: "absolute",
              top: "60px",
              right: "20px",
              padding: "8px 12px",
              background: isSearching
                ? "#2196f3"
                : searchResult?.includes("✓")
                ? "#4caf50"
                : "#ff9800",
              color: "white",
              borderRadius: "5px",
              fontSize: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              zIndex: 10,
              animation: "fadeIn 0.3s"
            }}
          >
            {isSearching ? "🔍 Buscando..." : searchResult}
          </div>
        )}

        {/* Controles de navegación */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            style={{
              padding: "5px 15px",
              background: pageNumber <= 1 ? "#666" : "#2196f3",
              color: "white",
              border: "none",
              borderRadius: "3px",
              cursor: pageNumber <= 1 ? "not-allowed" : "pointer",
              fontSize: "13px"
            }}
          >
            ◀ Anterior
          </button>
          <span style={{ fontSize: "14px" }}>
            Pág. {pageNumber} {numPages && `de ${numPages}`}
          </span>
          <button
            onClick={goToNextPage}
            disabled={!numPages || pageNumber >= numPages}
            style={{
              padding: "5px 15px",
              background: !numPages || pageNumber >= numPages ? "#666" : "#2196f3",
              color: "white",
              border: "none",
              borderRadius: "3px",
              cursor: !numPages || pageNumber >= numPages ? "not-allowed" : "pointer",
              fontSize: "13px"
            }}
          >
            Siguiente ▶
          </button>
          <input
            type="number"
            min="1"
            max={numPages || 1}
            value={pageNumber}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= (numPages || 1)) {
                setPageNumber(page);
              }
            }}
            style={{
              width: "60px",
              padding: "5px",
              borderRadius: "3px",
              border: "1px solid #666",
              textAlign: "center",
              fontSize: "13px"
            }}
          />
        </div>

        {/* Controles de zoom */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            style={{
              padding: "5px 12px",
              background: scale <= 0.5 ? "#666" : "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "3px",
              cursor: scale <= 0.5 ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "bold"
            }}
            title="Alejar"
          >
            −
          </button>
          <button
            onClick={resetZoom}
            style={{
              padding: "5px 12px",
              background: "#757575",
              color: "white",
              border: "none",
              borderRadius: "3px",
              cursor: "pointer",
              fontSize: "12px"
            }}
            title="Restablecer zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={zoomIn}
            disabled={scale >= 3.0}
            style={{
              padding: "5px 12px",
              background: scale >= 3.0 ? "#666" : "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "3px",
              cursor: scale >= 3.0 ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "bold"
            }}
            title="Acercar"
          >
            +
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
        {!pdfPath || pdfError ? (
          <div style={{
            color: "white",
            textAlign: "center",
            padding: "40px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "10px",
            maxWidth: "400px"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>📄</div>
            <h3 style={{ margin: "0 0 15px 0", fontSize: "18px" }}>
              {!pdfPath ? "Sin documento" : "PDF no disponible"}
            </h3>
            <p style={{ fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
              {!pdfPath
                ? "Selecciona un documento para ver su PDF."
                : "El archivo PDF no se encuentra disponible."}
            </p>
            <p style={{ fontSize: "13px", marginTop: "15px", opacity: 0.8 }}>
              Puedes trabajar con el editor sin el PDF de referencia.
            </p>
          </div>
        ) : (
          <Document
            file={pdfPath}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div style={{ color: "white", textAlign: "center", padding: "20px" }}>
                Cargando PDF...
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              renderTextLayer={true}
              renderAnnotationLayer={false}
              scale={scale}
              loading={
                <div style={{ color: "white", textAlign: "center", padding: "20px" }}>
                  Cargando página...
                </div>
              }
            />
          </Document>
        )}
      </div>
    </div>
  );
}
