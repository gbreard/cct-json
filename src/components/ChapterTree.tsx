import { useState } from "react";
import { useDocStore } from "../state/useDocStore";
import type { Capitulo, Articulo, Clausula, Anexo, SeccionPersonalizada } from "../lib/types";
import { highlightText } from "../lib/highlight";

export default function ChapterTree() {
  const { doc, selected, setSelected, addCapitulo, addArticulo, addClausula, addAnexo, addSeccionPersonalizada, searchTerm, statusFilter, reorderSeccionesPersonalizadas } = useDocStore();
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [draggedSeccionIndex, setDraggedSeccionIndex] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Función para verificar si un elemento pasa el filtro de status
  const passesStatusFilter = (status?: "OK" | "Corregir" | "Duda") => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "Sin revisar") return !status;
    return status === statusFilter;
  };

  if (!doc) {
    return (
      <div style={{ padding: "20px", color: "#666" }}>
        Cargando documento...
      </div>
    );
  }

  const toggleChapter = (index: number) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedChapters(newExpanded);
  };

  const handleAddChapter = () => {
    // Inicializar el array de capítulos si no existe
    if (!doc.estructura.capitulos) {
      doc.estructura.capitulos = [];
    }

    const existing = doc.estructura.capitulos.map((c) => c.numero);
    const nextNumber = existing.length > 0 ? Math.max(...existing) + 1 : 1;

    const numero = parseInt(window.prompt("Número del capítulo:", String(nextNumber)) || String(nextNumber));
    const titulo = window.prompt("Título del nuevo capítulo:", "Disposiciones especiales") || "Sin título";

    const newCapitulo: Capitulo = {
      numero,
      titulo,
      articulos: []
    };

    addCapitulo(newCapitulo);
  };

  const handleAddArticulo = (capIndex: number) => {
    if (!doc.estructura.capitulos) return;

    const capitulo = doc.estructura.capitulos[capIndex];
    const existingNumbers = capitulo.articulos.map(a => a.numero);
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

    const numero = parseInt(window.prompt("Número del artículo:", String(nextNumber)) || String(nextNumber));
    const titulo = window.prompt("Título del artículo (opcional):") || "";

    const newArticulo: Articulo = {
      numero,
      titulo,
      contenido: "", // Vacío - el usuario lo editará en el formulario
      incisos_detectados: [],
      num_incisos: 0,
      conceptos_detectados: [],
      tablas_detectadas: []
    };

    addArticulo(capIndex, newArticulo);

    // Seleccionar automáticamente el nuevo artículo
    const newArticuloIndex = capitulo.articulos.length; // El índice del nuevo artículo
    setSelected({ type: "articulo", capIndex, artIndex: newArticuloIndex });
  };

  const handleAddClausula = () => {
    // Inicializar el array de cláusulas si no existe
    if (!doc.estructura.clausulas) {
      doc.estructura.clausulas = [];
    }

    const existing = doc.estructura.clausulas.map((c) => c.numero);
    const nextNumber = existing.length > 0 ? Math.max(...existing) + 1 : 1;

    const numero = parseInt(window.prompt("Número de la cláusula:", String(nextNumber)) || String(nextNumber));
    const titulo = window.prompt("Título de la cláusula:", "") || "";

    const newClausula: Clausula = {
      numero,
      titulo,
      contenido: "", // Vacío - el usuario lo editará en el formulario
      longitud_caracteres: 0,
      longitud_lineas: 0,
      incisos_detectados: [],
      num_incisos: 0,
      conceptos_detectados: [],
      tablas_detectadas: []
    };

    addClausula(newClausula);

    // Seleccionar automáticamente la nueva cláusula
    const newClausulaIndex = doc.estructura.clausulas.length; // El índice de la nueva cláusula
    setSelected({ type: "clausula", clausIndex: newClausulaIndex });
  };

  const handleAddAnexo = () => {
    const anexos = doc.estructura.anexos || [];
    const nextNumber = anexos.length > 0 ? Math.max(...anexos.map(a => a.numero)) + 1 : 1;

    const numero = parseInt(window.prompt("Número del anexo:", String(nextNumber)) || String(nextNumber));
    const titulo = window.prompt("Título del anexo:", "Anexo - Escala Salarial") || "";
    const tipo = window.prompt("Tipo de anexo (TABLA/ESCALA_SALARIAL/DOCUMENTO/OTRO):", "ESCALA_SALARIAL") || "OTRO";

    const newAnexo: Anexo = {
      numero,
      titulo,
      tipo,
      contenido: "", // Vacío - el usuario lo editará en el formulario
      longitud_caracteres: 0,
      tablas_detectadas: []
    };

    addAnexo(newAnexo);

    // Seleccionar automáticamente el nuevo anexo
    const newAnexoIndex = anexos.length; // El índice del nuevo anexo
    setSelected({ type: "anexo", anexoIndex: newAnexoIndex });
  };

  const handleAddSeccionPersonalizada = () => {
    const secciones = doc.estructura.secciones_personalizadas || [];
    const nextOrden = secciones.length;

    const tipos = [
      "TABLA",
      "ESCALA_SALARIAL",
      "NOTA_ACLARATORIA",
      "DISPOSICION_TRANSITORIA",
      "FIRMANTES",
      "FECHA_VIGENCIA",
      "INTRODUCCION",
      "CONCLUSION",
      "BIBLIOGRAFIA",
      "OTRO"
    ];

    const titulo = window.prompt("Título de la sección:", "") || "";
    if (!titulo) {
      alert("El título es obligatorio");
      return;
    }

    const tipoElemento = window.prompt(
      `Tipo de elemento (sugerencias: ${tipos.slice(0, 5).join(", ")}... o cualquier texto libre):`,
      "TABLA"
    ) || "OTRO";

    const nivelPrompt = `Nivel de jerarquía - controla la indentación visual:

• Nivel 1: Elemento principal (sin indentación)
• Nivel 2: Sub-elemento (indentado hacia la derecha)
• Nivel 3: Detalle específico (más indentado)
• Nivel 4: Sub-detalle (máxima indentación)

Ejemplo: Si agregas "TABLA - Escala Salarial" usa nivel 1
Si agregas notas sobre esa tabla, usa nivel 2

Ingresa 1, 2, 3 o 4:`;

    const nivel = parseInt(window.prompt(nivelPrompt, "1") || "1");

    const newSeccion: SeccionPersonalizada = {
      id: `seccion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      titulo,
      tipo_elemento: tipoElemento,
      contenido: "", // Vacío - el usuario lo editará en el formulario
      nivel,
      orden: nextOrden,
      notas_revision: ""
    };

    addSeccionPersonalizada(newSeccion);

    // Seleccionar automáticamente la nueva sección
    const newSeccionIndex = secciones.length; // El índice de la nueva sección
    setSelected({ type: "seccion_personalizada", seccionIndex: newSeccionIndex });
  };

  // Determinar si el documento tiene capítulos o cláusulas
  const hasCapitulos = doc.estructura.capitulos && doc.estructura.capitulos.length > 0;
  const hasClausulas = doc.estructura.clausulas && doc.estructura.clausulas.length > 0;
  const hasPreambulo = doc.estructura.preambulo && doc.estructura.preambulo.length > 0;
  const hasAnexos = doc.estructura.anexos && doc.estructura.anexos.length > 0;
  const hasSeccionesPersonalizadas = doc.estructura.secciones_personalizadas && doc.estructura.secciones_personalizadas.length > 0;

  return (
    <div style={{ height: "100%", overflow: "auto", padding: "10px", background: "#f8f9fa" }}>
      {/* Botones de agregar - TODOS DISPONIBLES EN TODOS LOS DOCUMENTOS */}
      <div style={{ marginBottom: "15px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {/* Agregar Capítulo - disponible siempre */}
        <button
          onClick={handleAddChapter}
          style={{
            width: "100%",
            padding: "10px",
            background: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "13px"
          }}
        >
          ➕ Agregar Capítulo
        </button>

        {/* Agregar Cláusula - disponible siempre */}
        <button
          onClick={handleAddClausula}
          style={{
            width: "100%",
            padding: "10px",
            background: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "13px"
          }}
        >
          ➕ Agregar Cláusula
        </button>

        {/* Agregar Anexo - disponible siempre */}
        <button
          onClick={handleAddAnexo}
          style={{
            width: "100%",
            padding: "10px",
            background: "#f59e0b",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "13px"
          }}
        >
          📎 Agregar Anexo
        </button>

        {/* Agregar Sección Personalizada - COMPLETAMENTE LIBRE */}
        <button
          onClick={handleAddSeccionPersonalizada}
          style={{
            width: "100%",
            padding: "10px",
            background: "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "13px"
          }}
        >
          ✨ Crear Elemento Personalizado
        </button>

        {/* Botón de ayuda */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          style={{
            width: "100%",
            padding: "8px",
            background: showHelp ? "#e0e0e0" : "white",
            color: "#666",
            border: "1px solid #ddd",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px"
          }}
        >
          {showHelp ? "▼" : "▶"} ❓ Guía de uso
        </button>
      </div>

      {/* Panel de ayuda colapsable */}
      {showHelp && (
        <div style={{
          marginBottom: "15px",
          padding: "15px",
          background: "#f0f9ff",
          border: "2px solid #3b82f6",
          borderRadius: "8px",
          fontSize: "12px",
          lineHeight: "1.6"
        }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#1e40af", fontSize: "14px" }}>📘 Guía Rápida para Abogadas</h4>

          <div style={{ marginBottom: "12px" }}>
            <strong style={{ color: "#1e40af" }}>🎯 ¿Cuándo agregar elementos?</strong>
            <div style={{ marginTop: "4px", color: "#374151" }}>
              • Si el parseo no detectó un capítulo, artículo, cláusula o anexo<br />
              • Si hay tablas, escalas salariales o notas que no aparecen<br />
              • Si la estructura del documento no coincide con lo mostrado
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <strong style={{ color: "#1e40af" }}>📝 Tipos de elementos:</strong>
            <div style={{ marginTop: "4px", color: "#374151" }}>
              • <strong>Capítulo:</strong> Agrupa varios artículos<br />
              • <strong>Artículo:</strong> Unidad básica dentro de un capítulo<br />
              • <strong>Cláusula:</strong> Para acuerdos sin estructura de capítulos<br />
              • <strong>Anexo:</strong> Documentos adicionales (escalas, tablas)<br />
              • <strong>Elemento Personalizado:</strong> Para cualquier otra estructura
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <strong style={{ color: "#1e40af" }}>✨ Elemento Personalizado - Tipos comunes:</strong>
            <div style={{ marginTop: "4px", color: "#374151" }}>
              • <strong>TABLA:</strong> Tablas de datos<br />
              • <strong>ESCALA_SALARIAL:</strong> Escalas de sueldos<br />
              • <strong>NOTA_ACLARATORIA:</strong> Aclaraciones o referencias<br />
              • <strong>DISPOSICION_TRANSITORIA:</strong> Disposiciones temporales<br />
              • <strong>FIRMANTES:</strong> Datos de quienes firman el convenio<br />
              • O cualquier texto que describes la estructura
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <strong style={{ color: "#1e40af" }}>📊 Niveles de jerarquía (indentación):</strong>
            <div style={{ marginTop: "4px", color: "#374151" }}>
              • <strong>Nivel 1:</strong> Elemento principal (ej: "TABLA - Escala 2024")<br />
              • <strong>Nivel 2:</strong> Sub-elemento (ej: "Categoría A de la escala")<br />
              • <strong>Nivel 3:</strong> Detalle específico (ej: "Notas sobre categoría A")<br />
              • <strong>Nivel 4:</strong> Sub-detalle (ej: "Excepciones particulares")
            </div>
          </div>

          <div style={{ padding: "10px", background: "#dbeafe", borderRadius: "5px", marginTop: "10px" }}>
            <strong style={{ color: "#1e40af" }}>💡 Consejo:</strong>
            <div style={{ marginTop: "4px", color: "#374151" }}>
              No te preocupes por completar todo al crear el elemento. Solo ingresa número, título y tipo.
              El contenido largo lo pegas después en el formulario de edición.
            </div>
          </div>
        </div>
      )}

      {/* Info del documento */}
      <div style={{ marginBottom: "20px", padding: "10px", background: "white", borderRadius: "5px", fontSize: "13px" }}>
        <strong>{doc.metadata.nombre_archivo}</strong>
        <div style={{ color: "#666", marginTop: "5px", fontSize: "12px" }}>
          Tipo: {doc.metadata.tipo_documento}
        </div>
        <div style={{ color: "#666", fontSize: "12px" }}>
          Estructura: {doc.estructura.tipo}
        </div>
      </div>

      {/* Preámbulo */}
      {hasPreambulo && (
        <div style={{ marginBottom: "15px" }}>
          <div
            onClick={() => setSelected({ type: "preambulo" })}
            style={{
              padding: "10px",
              background: selected?.type === "preambulo" ? "#e3f2fd" : "white",
              borderRadius: "5px",
              cursor: "pointer",
              border: selected?.type === "preambulo" ? "2px solid #2196f3" : "1px solid #ddd",
              fontSize: "14px"
            }}
          >
            📄 <strong>Preámbulo</strong>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              {doc.estructura.preambulo!.substring(0, 80)}...
            </div>
          </div>
        </div>
      )}

      {/* Lista de Capítulos */}
      {hasCapitulos && (
        <div>
          <div style={{ fontSize: "12px", fontWeight: "bold", color: "#666", marginBottom: "8px", textTransform: "uppercase" }}>
            Capítulos ({doc.estructura.capitulos!.length})
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {doc.estructura.capitulos!.map((cap, capIndex) => {
              const isExpanded = expandedChapters.has(capIndex);
              const isSelected = selected?.type === "capitulo" && selected.capIndex === capIndex && selected.artIndex === undefined;

              return (
                <li key={capIndex} style={{ marginBottom: "10px" }}>
                  <div
                    style={{
                      background: isSelected ? "#e3f2fd" : "white",
                      padding: "10px",
                      borderRadius: "5px",
                      cursor: "pointer",
                      border: isSelected ? "2px solid #2196f3" : "1px solid #ddd"
                    }}
                  >
                    <div
                      onClick={() => {
                        setSelected({ type: "capitulo", capIndex });
                        toggleChapter(capIndex);
                      }}
                      style={{ display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      <span style={{ fontSize: "16px" }}>
                        {isExpanded ? "📖" : "📕"}
                      </span>
                      <strong>
                        {cap.numero_romano || cap.numero}.
                      </strong>
                      <span style={{ fontSize: "14px" }}>
                        {searchTerm ? highlightText(cap.titulo, searchTerm) : cap.titulo}
                      </span>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: "10px" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddArticulo(capIndex);
                          }}
                          style={{
                            width: "100%",
                            padding: "6px",
                            background: "#f0f0f0",
                            border: "1px dashed #999",
                            borderRadius: "3px",
                            cursor: "pointer",
                            fontSize: "12px",
                            marginBottom: "8px"
                          }}
                        >
                          ➕ Agregar Artículo
                        </button>

                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {cap.articulos
                            .map((art, artIndex) => ({ art, artIndex }))
                            .filter(({ art }) => passesStatusFilter(art.status))
                            .map(({ art, artIndex }) => {
                              const artSelected = selected?.type === "articulo" && selected?.capIndex === capIndex && selected?.artIndex === artIndex;

                              return (
                              <li
                                key={artIndex}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelected({ type: "articulo", capIndex, artIndex });
                                }}
                                style={{
                                  padding: "8px",
                                  background: artSelected ? "#fff9c4" : "#fafafa",
                                  marginBottom: "5px",
                                  borderRadius: "3px",
                                  cursor: "pointer",
                                  fontSize: "13px",
                                  border: artSelected ? "2px solid #fbc02d" : "1px solid #e0e0e0"
                                }}
                              >
                                <div>
                                  <strong>Art. {art.numero}</strong>
                                  {art.titulo && (
                                    <span style={{ marginLeft: "5px", color: "#666" }}>
                                      – {searchTerm ? highlightText(art.titulo, searchTerm) : art.titulo}
                                    </span>
                                  )}
                                </div>
                                {art.incisos_detectados && art.incisos_detectados.length > 0 && (
                                  <div style={{ fontSize: "11px", color: "#999", marginTop: "3px" }}>
                                    📋 {art.incisos_detectados.length} incisos
                                  </div>
                                )}
                                {art.conceptos_detectados && art.conceptos_detectados.length > 0 && (
                                  <div style={{ fontSize: "11px", color: "#999", marginTop: "3px" }}>
                                    🏷️ {art.conceptos_detectados.length} conceptos
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Lista de Cláusulas */}
      {hasClausulas && (
        <div>
          <div style={{ fontSize: "12px", fontWeight: "bold", color: "#666", marginBottom: "8px", textTransform: "uppercase" }}>
            Cláusulas ({doc.estructura.clausulas!.length})
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {doc.estructura.clausulas!
              .map((claus, clausIndex) => ({ claus, clausIndex }))
              .filter(({ claus }) => passesStatusFilter(claus.status))
              .map(({ claus, clausIndex }) => {
                const isSelected = selected?.type === "clausula" && selected.clausIndex === clausIndex;

                return (
                <li
                  key={clausIndex}
                  onClick={() => setSelected({ type: "clausula", clausIndex })}
                  style={{
                    padding: "10px",
                    background: isSelected ? "#fff9c4" : "white",
                    marginBottom: "8px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "14px",
                    border: isSelected ? "2px solid #fbc02d" : "1px solid #ddd"
                  }}
                >
                  <div>
                    <strong>Cláusula {claus.numero}</strong>
                    {claus.ordinal && <span style={{ marginLeft: "5px", color: "#999" }}>({claus.ordinal})</span>}
                  </div>
                  {claus.titulo && (
                    <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                      {searchTerm ? highlightText(claus.titulo, searchTerm) : claus.titulo}
                    </div>
                  )}
                  {claus.conceptos_detectados && claus.conceptos_detectados.length > 0 && (
                    <div style={{ fontSize: "11px", color: "#999", marginTop: "5px" }}>
                      🏷️ {claus.conceptos_detectados.length} conceptos
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Lista de Anexos */}
      {hasAnexos && (
        <div>
          <div style={{ fontSize: "12px", fontWeight: "bold", color: "#666", marginBottom: "8px", textTransform: "uppercase" }}>
            Anexos ({doc.estructura.anexos!.length})
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {doc.estructura.anexos!
              .map((anexo, anexoIndex) => ({ anexo, anexoIndex }))
              .filter(({ anexo }) => passesStatusFilter(anexo.status))
              .map(({ anexo, anexoIndex }) => {
                const isSelected = selected?.type === "anexo" && selected.anexoIndex === anexoIndex;

                return (
                <li
                  key={anexoIndex}
                  onClick={() => setSelected({ type: "anexo", anexoIndex })}
                  style={{
                    padding: "10px",
                    background: isSelected ? "#fef3c7" : "white",
                    marginBottom: "8px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "14px",
                    border: isSelected ? "2px solid #f59e0b" : "1px solid #ddd"
                  }}
                >
                  <div>
                    <strong>📎 Anexo {anexo.numero}</strong>
                    {anexo.tipo && <span style={{ marginLeft: "5px", color: "#999" }}>({anexo.tipo})</span>}
                  </div>
                  {anexo.titulo && (
                    <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                      {searchTerm ? highlightText(anexo.titulo, searchTerm) : anexo.titulo}
                    </div>
                  )}
                  {anexo.tablas_detectadas && anexo.tablas_detectadas.length > 0 && (
                    <div style={{ fontSize: "11px", color: "#999", marginTop: "5px" }}>
                      📊 {anexo.tablas_detectadas.length} tablas
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Lista de Secciones Personalizadas - CON DRAG AND DROP */}
      {hasSeccionesPersonalizadas && (
        <div>
          <div style={{ fontSize: "12px", fontWeight: "bold", color: "#666", marginBottom: "8px", textTransform: "uppercase" }}>
            Elementos Personalizados ({doc.estructura.secciones_personalizadas!.length})
            <span style={{ marginLeft: "8px", fontSize: "10px", color: "#999", fontWeight: "normal" }}>
              (arrastra para reordenar)
            </span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {doc.estructura.secciones_personalizadas!
              .sort((a, b) => (a.orden || 0) - (b.orden || 0))
              .map((seccion, seccionIndex) => ({ seccion, seccionIndex }))
              .filter(({ seccion }) => passesStatusFilter(seccion.status))
              .map(({ seccion, seccionIndex }) => {
                const isSelected = selected?.type === "seccion_personalizada" && selected.seccionIndex === seccionIndex;
                const isDragging = draggedSeccionIndex === seccionIndex;

                // Determinar el icono según el tipo
                const getIcono = (tipo: string) => {
                  const tipos: Record<string, string> = {
                    "TABLA": "📊",
                    "ESCALA_SALARIAL": "💰",
                    "NOTA_ACLARATORIA": "📝",
                    "DISPOSICION_TRANSITORIA": "⏱️",
                    "FIRMANTES": "✍️",
                    "FECHA_VIGENCIA": "📅",
                    "INTRODUCCION": "📖",
                    "CONCLUSION": "🎯",
                    "BIBLIOGRAFIA": "📚"
                  };
                  return tipos[tipo] || "✨";
                };

                return (
                <li
                  key={seccionIndex}
                  draggable
                  onDragStart={(e) => {
                    setDraggedSeccionIndex(seccionIndex);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedSeccionIndex !== null && draggedSeccionIndex !== seccionIndex) {
                      reorderSeccionesPersonalizadas(draggedSeccionIndex, seccionIndex);
                    }
                    setDraggedSeccionIndex(null);
                  }}
                  onDragEnd={() => {
                    setDraggedSeccionIndex(null);
                  }}
                  onClick={() => setSelected({ type: "seccion_personalizada", seccionIndex })}
                  style={{
                    padding: "10px",
                    paddingLeft: `${10 + ((seccion.nivel || 1) - 1) * 15}px`,
                    background: isDragging ? "#e0e0e0" : (isSelected ? "#f3e8ff" : "white"),
                    marginBottom: "8px",
                    borderRadius: "5px",
                    cursor: isDragging ? "grabbing" : "grab",
                    fontSize: "14px",
                    border: isSelected ? "2px solid #8b5cf6" : (isDragging ? "2px dashed #999" : "1px solid #ddd"),
                    opacity: isDragging ? 0.5 : 1,
                    transition: "opacity 0.2s, background 0.2s"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "16px", cursor: "grab" }}>⋮⋮</span>
                    <div style={{ flex: 1 }}>
                      <div>
                        <strong>{getIcono(seccion.tipo_elemento)} {seccion.titulo}</strong>
                        <span style={{ marginLeft: "5px", fontSize: "11px", color: "#999", background: "#f0f0f0", padding: "2px 6px", borderRadius: "3px" }}>
                          {seccion.tipo_elemento}
                        </span>
                      </div>
                      {seccion.contenido && (
                        <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                          {searchTerm ? highlightText(seccion.contenido.substring(0, 80) + "...", searchTerm) : seccion.contenido.substring(0, 80) + "..."}
                        </div>
                      )}
                      {seccion.error_estructural && (
                        <div style={{ fontSize: "11px", color: "#f44336", marginTop: "5px" }}>
                          ⚠️ {seccion.error_estructural}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Mensaje si no hay estructura */}
      {!hasCapitulos && !hasClausulas && !hasPreambulo && !hasAnexos && !hasSeccionesPersonalizadas && (
        <div style={{ padding: "20px", textAlign: "center", color: "#999", fontSize: "14px" }}>
          <p>Este documento no tiene estructura parseada</p>
          <p style={{ fontSize: "12px" }}>Tipo: {doc.estructura.tipo}</p>
          <p style={{ fontSize: "12px", marginTop: "10px" }}>
            Usa "✨ Crear Elemento Personalizado" para agregar la estructura que falta
          </p>
        </div>
      )}
    </div>
  );
}
