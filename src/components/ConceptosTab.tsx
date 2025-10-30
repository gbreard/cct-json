import { useState, useEffect, useMemo } from "react";
import { useDocStore } from "../state/useDocStore";
import type { ConceptoDetectado, ConceptoTesauro, Tesauro } from "../lib/types";

interface ConceptoAgregado {
  id: string;
  termino: string;
  frecuenciaTotal: number;
  confianzaPromedio: number;
  articulos: number[]; // Números de artículos donde aparece
  posiciones: { articulo: number; posiciones: number[] }[];
}

type FiltroValidacion = "todos" | "pendientes" | "validados" | "corregidos" | "eliminados";

export default function ConceptosTab() {
  const { doc, validarConcepto, corregirConcepto, eliminarConcepto } = useDocStore();
  const [tesauro, setTesauro] = useState<Tesauro | null>(null);
  const [loadingTesauro, setLoadingTesauro] = useState(true);
  const [filtro, setFiltro] = useState<FiltroValidacion>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [conceptoSeleccionado, setConceptoSeleccionado] = useState<string | null>(null);
  const [showCorregirModal, setShowCorregirModal] = useState<{ conceptoId: string; termino: string } | null>(null);

  // Cargar tesauro
  useEffect(() => {
    fetch("/tesauro_convenios_colectivos.json")
      .then(res => res.json())
      .then((data: Tesauro) => {
        setTesauro(data);
        setLoadingTesauro(false);
      })
      .catch(err => {
        console.error("Error cargando tesauro:", err);
        setLoadingTesauro(false);
      });
  }, []);

  // Agregar todos los conceptos detectados en todos los artículos
  const conceptosAgregados: ConceptoAgregado[] = useMemo(() => {
    if (!doc?.estructura.capitulos) return [];

    const conceptosMap = new Map<string, ConceptoAgregado>();

    doc.estructura.capitulos.forEach((cap) => {
      cap.articulos.forEach((art) => {
        if (art.conceptos_detectados) {
          art.conceptos_detectados.forEach((concepto) => {
            const existing = conceptosMap.get(concepto.id);

            if (existing) {
              // Agregar a concepto existente
              existing.frecuenciaTotal += concepto.frecuencia;
              existing.confianzaPromedio = (existing.confianzaPromedio + concepto.confianza) / 2;
              existing.articulos.push(art.numero);
              existing.posiciones.push({
                articulo: art.numero,
                posiciones: concepto.posiciones
              });
            } else {
              // Crear nuevo concepto agregado
              conceptosMap.set(concepto.id, {
                id: concepto.id,
                termino: concepto.termino,
                frecuenciaTotal: concepto.frecuencia,
                confianzaPromedio: concepto.confianza,
                articulos: [art.numero],
                posiciones: [{
                  articulo: art.numero,
                  posiciones: concepto.posiciones
                }]
              });
            }
          });
        }
      });
    });

    return Array.from(conceptosMap.values()).sort((a, b) => b.frecuenciaTotal - a.frecuenciaTotal);
  }, [doc]);

  // Filtrar conceptos según el filtro seleccionado
  const conceptosFiltrados = useMemo(() => {
    let filtered = conceptosAgregados;

    // Aplicar filtro de validación
    if (filtro !== "todos") {
      filtered = filtered.filter(concepto => {
        // Buscar el concepto en los artículos para obtener su estado de validación
        if (doc?.estructura.capitulos) {
          for (const cap of doc.estructura.capitulos) {
            for (const art of cap.articulos) {
              const conceptoEncontrado = art.conceptos_detectados?.find(c => c.id === concepto.id);
              if (conceptoEncontrado) {
                if (filtro === "pendientes") {
                  return !conceptoEncontrado.validado && !conceptoEncontrado.accion_validacion;
                } else if (filtro === "validados") {
                  return conceptoEncontrado.validado === true || conceptoEncontrado.accion_validacion === "validar";
                } else if (filtro === "corregidos") {
                  return conceptoEncontrado.accion_validacion === "corregir";
                } else if (filtro === "eliminados") {
                  return conceptoEncontrado.accion_validacion === "eliminar";
                }
              }
            }
          }
        }

        return false;
      });
    }

    // Aplicar búsqueda
    if (busqueda.trim()) {
      const searchLower = busqueda.toLowerCase();
      filtered = filtered.filter(concepto =>
        concepto.id.toLowerCase().includes(searchLower) ||
        concepto.termino.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [conceptosAgregados, filtro, busqueda, doc]);

  // Obtener información del tesauro para un concepto
  const getConceptoTesauro = (id: string): ConceptoTesauro | undefined => {
    return tesauro?.tesauro.conceptos.find(c => c.id === id);
  };

  // Obtener estado de validación de un concepto (del primer artículo donde aparece)
  const getEstadoValidacion = (conceptoId: string): ConceptoDetectado | undefined => {
    if (!doc?.estructura.capitulos) return undefined;

    for (const cap of doc.estructura.capitulos) {
      for (const art of cap.articulos) {
        const concepto = art.conceptos_detectados?.find(c => c.id === conceptoId);
        if (concepto) return concepto;
      }
    }

    return undefined;
  };

  if (loadingTesauro) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        fontSize: "16px",
        color: "#666"
      }}>
        Cargando tesauro...
      </div>
    );
  }

  if (!tesauro) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        fontSize: "16px",
        color: "#f44336"
      }}>
        Error: No se pudo cargar el tesauro
      </div>
    );
  }

  const conceptoTesauroSeleccionado = conceptoSeleccionado ? getConceptoTesauro(conceptoSeleccionado) : null;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "#fafafa",
      overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{
        padding: "20px",
        background: "white",
        borderBottom: "2px solid #e0e0e0"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px"
        }}>
          <h2 style={{
            margin: 0,
            fontSize: "24px",
            color: "#333"
          }}>
            🔍 Validación de Conceptos (Tesauro)
          </h2>

          <div style={{
            fontSize: "14px",
            color: "#666",
            background: "#f5f5f5",
            padding: "8px 15px",
            borderRadius: "20px"
          }}>
            <strong>{conceptosAgregados.length}</strong> conceptos únicos detectados
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div style={{
          display: "flex",
          gap: "15px",
          alignItems: "center",
          flexWrap: "wrap"
        }}>
          {/* Botones de filtro */}
          <div style={{ display: "flex", gap: "10px" }}>
            {([
              { key: "todos", label: "Todos", color: "#999" },
              { key: "pendientes", label: "Pendientes", color: "#ff9800" },
              { key: "validados", label: "Validados", color: "#4caf50" },
              { key: "corregidos", label: "Corregidos", color: "#2196f3" },
              { key: "eliminados", label: "Eliminados", color: "#f44336" }
            ] as { key: FiltroValidacion; label: string; color: string }[]).map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setFiltro(key)}
                style={{
                  padding: "8px 16px",
                  background: filtro === key ? color : "white",
                  color: filtro === key ? "white" : color,
                  border: `2px solid ${color}`,
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "bold",
                  transition: "all 0.2s"
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Búsqueda */}
          <input
            type="text"
            placeholder="Buscar por ID o término..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              flex: 1,
              minWidth: "250px",
              padding: "8px 15px",
              border: "2px solid #ddd",
              borderRadius: "20px",
              fontSize: "14px"
            }}
          />

          {/* TODO: Botón agregar concepto - implementar funcionalidad */}
          {/* <button
            onClick={() => {}}
            style={{
              padding: "8px 16px",
              background: "#673ab7",
              color: "white",
              border: "none",
              borderRadius: "20px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "bold"
            }}
          >
            + Agregar Concepto
          </button> */}
        </div>

        {/* Información del tesauro */}
        <div style={{
          marginTop: "15px",
          padding: "10px 15px",
          background: "#e8eaf6",
          borderRadius: "8px",
          fontSize: "13px",
          color: "#3f51b5"
        }}>
          <strong>Tesauro:</strong> {tesauro.tesauro.ambito} |
          <strong> Versión:</strong> {tesauro.tesauro.version} |
          <strong> Última actualización:</strong> {tesauro.tesauro.fecha_actualizacion} |
          <strong> Total conceptos:</strong> {tesauro.tesauro.conceptos.length}
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{
        display: "flex",
        flex: 1,
        overflow: "hidden"
      }}>
        {/* Lista de conceptos */}
        <div style={{
          flex: conceptoSeleccionado ? 0.6 : 1,
          overflowY: "auto",
          padding: "20px",
          transition: "flex 0.3s"
        }}>
          {conceptosFiltrados.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "40px",
              color: "#999",
              fontSize: "16px"
            }}>
              {busqueda ? "No se encontraron conceptos con esa búsqueda" : "No hay conceptos en esta categoría"}
            </div>
          ) : (
            <div style={{
              display: "grid",
              gap: "15px"
            }}>
              {conceptosFiltrados.map((concepto) => {
                const estadoValidacion = getEstadoValidacion(concepto.id);
                const conceptoInfo = getConceptoTesauro(concepto.id);

                return (
                  <div
                    key={concepto.id}
                    onClick={() => setConceptoSeleccionado(concepto.id === conceptoSeleccionado ? null : concepto.id)}
                    style={{
                      background: "white",
                      padding: "20px",
                      borderRadius: "12px",
                      boxShadow: conceptoSeleccionado === concepto.id
                        ? "0 4px 20px rgba(0,0,0,0.15)"
                        : "0 2px 8px rgba(0,0,0,0.1)",
                      cursor: "pointer",
                      border: conceptoSeleccionado === concepto.id ? "3px solid #2196f3" : "3px solid transparent",
                      transition: "all 0.2s"
                    }}
                  >
                    {/* Header del concepto */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px"
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: "18px",
                          fontWeight: "bold",
                          color: "#333",
                          marginBottom: "5px"
                        }}>
                          {concepto.termino}
                        </div>
                        <div style={{
                          fontSize: "13px",
                          color: "#999",
                          marginBottom: "8px"
                        }}>
                          ID: {concepto.id} {conceptoInfo?.acronimo && `• ${conceptoInfo.acronimo}`}
                        </div>
                        {conceptoInfo?.definicion && (
                          <div style={{
                            fontSize: "13px",
                            color: "#666",
                            lineHeight: "1.4",
                            marginTop: "8px"
                          }}>
                            {conceptoInfo.definicion.length > 150
                              ? conceptoInfo.definicion.substring(0, 150) + "..."
                              : conceptoInfo.definicion}
                          </div>
                        )}
                      </div>

                      {/* Badge de estado */}
                      <div>
                        {estadoValidacion?.validado === true || estadoValidacion?.accion_validacion === "validar" ? (
                          <span style={{
                            padding: "6px 12px",
                            background: "#4caf50",
                            color: "white",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "bold"
                          }}>
                            ✓ Validado
                          </span>
                        ) : estadoValidacion?.accion_validacion === "corregir" ? (
                          <span style={{
                            padding: "6px 12px",
                            background: "#2196f3",
                            color: "white",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "bold"
                          }}>
                            🔧 Corregir
                          </span>
                        ) : estadoValidacion?.accion_validacion === "eliminar" ? (
                          <span style={{
                            padding: "6px 12px",
                            background: "#f44336",
                            color: "white",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "bold"
                          }}>
                            ✕ Eliminar
                          </span>
                        ) : (
                          <span style={{
                            padding: "6px 12px",
                            background: "#ff9800",
                            color: "white",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "bold"
                          }}>
                            ⏳ Pendiente
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Estadísticas */}
                    <div style={{
                      display: "flex",
                      gap: "20px",
                      fontSize: "13px",
                      color: "#666",
                      marginBottom: "12px"
                    }}>
                      <div>
                        <strong>Frecuencia:</strong> {concepto.frecuenciaTotal}x
                      </div>
                      <div>
                        <strong>Confianza:</strong> {(concepto.confianzaPromedio * 100).toFixed(0)}%
                      </div>
                      <div>
                        <strong>Artículos:</strong> {concepto.articulos.length}
                      </div>
                    </div>

                    {/* Validación info */}
                    {estadoValidacion?.validado_por && (
                      <div style={{
                        marginTop: "12px",
                        padding: "10px",
                        background: "#f5f5f5",
                        borderRadius: "6px",
                        fontSize: "12px",
                        color: "#666"
                      }}>
                        <div><strong>Validado por:</strong> {estadoValidacion.validado_por}</div>
                        {estadoValidacion.fecha_validacion && (
                          <div><strong>Fecha:</strong> {new Date(estadoValidacion.fecha_validacion).toLocaleDateString()}</div>
                        )}
                        {estadoValidacion.notas_validacion && (
                          <div style={{ marginTop: "5px" }}>
                            <strong>Notas:</strong> {estadoValidacion.notas_validacion}
                          </div>
                        )}
                        {estadoValidacion.concepto_correcto && (
                          <div style={{ marginTop: "5px" }}>
                            <strong>Concepto correcto:</strong> {estadoValidacion.concepto_correcto}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "15px",
                      paddingTop: "15px",
                      borderTop: "1px solid #eee"
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`¿Validar el concepto "${concepto.termino}" (${concepto.id})?`)) {
                            validarConcepto(concepto.id);
                            alert(`✓ Concepto validado correctamente en todos los artículos donde aparece`);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: "8px 16px",
                          background: "#4caf50",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "bold"
                        }}
                      >
                        ✓ Validar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCorregirModal({ conceptoId: concepto.id, termino: concepto.termino });
                        }}
                        style={{
                          flex: 1,
                          padding: "8px 16px",
                          background: "#2196f3",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "bold"
                        }}
                      >
                        🔧 Corregir
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(
                            `¿Eliminar el concepto "${concepto.termino}" (${concepto.id})?\n\n` +
                            `Esta acción marcará el concepto como eliminado en todos los artículos donde aparece.\n` +
                            `El concepto NO se borrará, solo se marcará como eliminado.`
                          )) {
                            eliminarConcepto(concepto.id);
                            alert(`✓ Concepto marcado como eliminado en todos los artículos`);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: "8px 16px",
                          background: "#f44336",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "bold"
                        }}
                      >
                        ✕ Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel de detalles del concepto seleccionado */}
        {conceptoSeleccionado && conceptoTesauroSeleccionado && (
          <div style={{
            flex: 0.4,
            background: "white",
            borderLeft: "2px solid #e0e0e0",
            overflowY: "auto",
            padding: "20px"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px"
            }}>
              <h3 style={{ margin: 0, fontSize: "20px", color: "#333" }}>
                Detalles del Concepto
              </h3>
              <button
                onClick={() => setConceptoSeleccionado(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#999"
                }}
              >
                ×
              </button>
            </div>

            <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
              <div style={{ marginBottom: "20px" }}>
                <div style={{
                  fontSize: "22px",
                  fontWeight: "bold",
                  color: "#333",
                  marginBottom: "5px"
                }}>
                  {conceptoTesauroSeleccionado.termino_preferido}
                </div>
                <div style={{ color: "#999", fontSize: "13px" }}>
                  ID: {conceptoTesauroSeleccionado.id}
                  {conceptoTesauroSeleccionado.acronimo && ` • ${conceptoTesauroSeleccionado.acronimo}`}
                </div>
              </div>

              {/* Definición */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{
                  fontWeight: "bold",
                  color: "#555",
                  marginBottom: "8px"
                }}>
                  Definición:
                </div>
                <div style={{ color: "#666" }}>
                  {conceptoTesauroSeleccionado.definicion}
                </div>
              </div>

              {/* Términos no preferidos */}
              {conceptoTesauroSeleccionado.terminos_no_preferidos && conceptoTesauroSeleccionado.terminos_no_preferidos.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{
                    fontWeight: "bold",
                    color: "#555",
                    marginBottom: "8px"
                  }}>
                    Sinónimos / Términos alternativos:
                  </div>
                  <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px"
                  }}>
                    {conceptoTesauroSeleccionado.terminos_no_preferidos.map((termino, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: "4px 10px",
                          background: "#e3f2fd",
                          color: "#1976d2",
                          borderRadius: "12px",
                          fontSize: "12px"
                        }}
                      >
                        {termino}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Relaciones */}
              {conceptoTesauroSeleccionado.relaciones && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{
                    fontWeight: "bold",
                    color: "#555",
                    marginBottom: "8px"
                  }}>
                    Relaciones:
                  </div>

                  {conceptoTesauroSeleccionado.relaciones.terminos_generales && conceptoTesauroSeleccionado.relaciones.terminos_generales.length > 0 && (
                    <div style={{ marginBottom: "10px" }}>
                      <div style={{ fontSize: "12px", color: "#777", marginBottom: "5px" }}>
                        <strong>Términos generales:</strong>
                      </div>
                      <div>{conceptoTesauroSeleccionado.relaciones.terminos_generales.join(", ")}</div>
                    </div>
                  )}

                  {conceptoTesauroSeleccionado.relaciones.terminos_especificos && conceptoTesauroSeleccionado.relaciones.terminos_especificos.length > 0 && (
                    <div style={{ marginBottom: "10px" }}>
                      <div style={{ fontSize: "12px", color: "#777", marginBottom: "5px" }}>
                        <strong>Términos específicos:</strong>
                      </div>
                      <div>{conceptoTesauroSeleccionado.relaciones.terminos_especificos.join(", ")}</div>
                    </div>
                  )}

                  {conceptoTesauroSeleccionado.relaciones.terminos_relacionados && conceptoTesauroSeleccionado.relaciones.terminos_relacionados.length > 0 && (
                    <div style={{ marginBottom: "10px" }}>
                      <div style={{ fontSize: "12px", color: "#777", marginBottom: "5px" }}>
                        <strong>Términos relacionados:</strong>
                      </div>
                      <div>{conceptoTesauroSeleccionado.relaciones.terminos_relacionados.join(", ")}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Notas */}
              {conceptoTesauroSeleccionado.notas && conceptoTesauroSeleccionado.notas.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{
                    fontWeight: "bold",
                    color: "#555",
                    marginBottom: "8px"
                  }}>
                    Notas:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "20px", color: "#666" }}>
                    {conceptoTesauroSeleccionado.notas.map((nota, idx) => (
                      <li key={idx}>{nota}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ejemplos */}
              {conceptoTesauroSeleccionado.ejemplos && conceptoTesauroSeleccionado.ejemplos.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{
                    fontWeight: "bold",
                    color: "#555",
                    marginBottom: "8px"
                  }}>
                    Ejemplos:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "20px", color: "#666" }}>
                    {conceptoTesauroSeleccionado.ejemplos.map((ejemplo, idx) => (
                      <li key={idx}>{ejemplo}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal para corregir concepto */}
      {showCorregirModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000
        }}>
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "30px",
            maxWidth: "600px",
            width: "90%",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
          }}>
            <h3 style={{
              marginTop: 0,
              marginBottom: "20px",
              fontSize: "22px",
              color: "#333"
            }}>
              🔧 Corregir Concepto
            </h3>

            <div style={{ marginBottom: "20px" }}>
              <div style={{
                padding: "15px",
                background: "#f5f5f5",
                borderRadius: "8px",
                marginBottom: "15px"
              }}>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "5px" }}>
                  <strong>Concepto actual:</strong>
                </div>
                <div style={{ fontSize: "16px", color: "#333" }}>
                  {showCorregirModal.termino} <span style={{ color: "#999" }}>({showCorregirModal.conceptoId})</span>
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#555",
                  marginBottom: "8px"
                }}>
                  ID del concepto correcto:
                </label>
                <input
                  type="text"
                  id="conceptoCorrecto"
                  placeholder="Ej: C1234"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                />
                <div style={{ fontSize: "12px", color: "#999", marginTop: "5px" }}>
                  Ingresá el ID del concepto correcto del tesauro
                </div>
              </div>

              <div>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#555",
                  marginBottom: "8px"
                }}>
                  Notas / Motivo de corrección:
                </label>
                <textarea
                  id="notasCorreccion"
                  placeholder="Explicá por qué este concepto debe ser corregido..."
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    resize: "vertical"
                  }}
                />
              </div>
            </div>

            <div style={{
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end"
            }}>
              <button
                onClick={() => setShowCorregirModal(null)}
                style={{
                  padding: "10px 20px",
                  background: "#999",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold"
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const conceptoCorrectoInput = document.getElementById("conceptoCorrecto") as HTMLInputElement;
                  const notasInput = document.getElementById("notasCorreccion") as HTMLTextAreaElement;

                  const conceptoCorrecto = conceptoCorrectoInput?.value.trim();
                  const notas = notasInput?.value.trim();

                  if (!conceptoCorrecto) {
                    alert("Por favor ingresá el ID del concepto correcto");
                    return;
                  }

                  if (!notas) {
                    alert("Por favor ingresá el motivo de la corrección");
                    return;
                  }

                  // Verificar que el concepto existe en el tesauro
                  const conceptoEnTesauro = tesauro?.tesauro.conceptos.find(c => c.id === conceptoCorrecto);
                  if (!conceptoEnTesauro) {
                    if (!confirm(
                      `ADVERTENCIA: El concepto ${conceptoCorrecto} no se encontró en el tesauro.\n\n` +
                      `¿Estás seguro de que querés usar este ID?`
                    )) {
                      return;
                    }
                  }

                  corregirConcepto(showCorregirModal.conceptoId, conceptoCorrecto, notas);
                  alert(
                    `✓ Concepto marcado para corrección\n\n` +
                    `Original: ${showCorregirModal.conceptoId}\n` +
                    `Correcto: ${conceptoCorrecto}\n\n` +
                    `Se actualizó en todos los artículos donde aparece.`
                  );
                  setShowCorregirModal(null);
                }}
                style={{
                  padding: "10px 20px",
                  background: "#2196f3",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold"
                }}
              >
                Guardar Corrección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
