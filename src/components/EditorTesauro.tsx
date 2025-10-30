import { useState, useEffect, useMemo } from "react";
import type { ConceptoTesauro, Tesauro } from "../lib/types";

interface ConceptoModificado extends ConceptoTesauro {
  modificado?: boolean;
  nuevo?: boolean;
}

type VistaEditor = "lista" | "detalle" | "agregar" | "editar";

interface EditorTesauroProps {
  onBack: () => void;
}

export default function EditorTesauro({ onBack }: EditorTesauroProps) {
  const [tesauro, setTesauro] = useState<Tesauro | null>(null);
  const [conceptos, setConceptos] = useState<ConceptoModificado[]>([]);
  const [loadingTesauro, setLoadingTesauro] = useState(true);
  const [vista, setVista] = useState<VistaEditor>("lista");
  const [conceptoSeleccionado, setConceptoSeleccionado] = useState<ConceptoModificado | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroModificados, setFiltroModificados] = useState<"todos" | "originales" | "modificados">("todos");

  // Formulario para nuevo concepto / edición
  const [formData, setFormData] = useState<ConceptoModificado>({
    id: "",
    termino_preferido: "",
    definicion: "",
    acronimo: "",
    terminos_no_preferidos: [],
    relaciones: {
      terminos_especificos: [],
      terminos_generales: [],
      terminos_relacionados: []
    },
    notas: [],
    ejemplos: []
  });

  // Helper: Formatear relación mostrando término (ID)
  const formatearRelacion = (id: string): string => {
    const concepto = conceptos.find(c => c.id === id);
    if (concepto) {
      return `${concepto.termino_preferido} (${id})`;
    }
    return id;
  };

  // Helper: Convertir término o ID a ID puro
  const convertirAId = (texto: string): string => {
    // Si es un formato "Término (ID)", extraer el ID
    const matchParentesis = texto.match(/\(([^)]+)\)$/);
    if (matchParentesis) {
      return matchParentesis[1];
    }

    // Si parece un ID (empieza con C seguido de números), devolverlo tal cual
    if (/^C\d+$/.test(texto.trim())) {
      return texto.trim();
    }

    // Buscar por término exacto
    const conceptoPorTermino = conceptos.find(
      c => c.termino_preferido.toLowerCase() === texto.toLowerCase().trim()
    );
    if (conceptoPorTermino) {
      return conceptoPorTermino.id;
    }

    // Si no se encuentra, devolver el texto original (podría ser un concepto nuevo)
    return texto.trim();
  };

  // Cargar tesauro y conceptos modificados de localStorage
  useEffect(() => {
    const cargarTesauro = async () => {
      try {
        const res = await fetch("/tesauro_convenios_colectivos.json");
        const data: Tesauro = await res.json();
        setTesauro(data);

        // Cargar modificaciones de localStorage
        const modificadosStr = localStorage.getItem("tesauro_modificaciones");
        const modificados: ConceptoModificado[] = modificadosStr ? JSON.parse(modificadosStr) : [];

        // Combinar conceptos originales con modificados
        const conceptosOriginales = data.tesauro.conceptos.map(c => ({ ...c, modificado: false, nuevo: false }));
        const conceptosNuevos = modificados.filter(m => m.nuevo);

        // Reemplazar conceptos modificados
        const conceptosFinales = conceptosOriginales.map(original => {
          const modificado = modificados.find(m => m.id === original.id && !m.nuevo);
          return modificado ? { ...modificado, modificado: true } : original;
        });

        // Agregar conceptos nuevos
        setConceptos([...conceptosFinales, ...conceptosNuevos]);
        setLoadingTesauro(false);
      } catch (error) {
        console.error("Error al cargar tesauro:", error);
        alert("Error al cargar el tesauro. Revisa la consola.");
        setLoadingTesauro(false);
      }
    };

    cargarTesauro();
  }, []);

  // Guardar modificaciones en localStorage
  const guardarModificaciones = (nuevosConceptos: ConceptoModificado[]) => {
    const modificados = nuevosConceptos.filter(c => c.modificado || c.nuevo);
    localStorage.setItem("tesauro_modificaciones", JSON.stringify(modificados));
    setConceptos(nuevosConceptos);
  };

  // Filtrar y buscar conceptos
  const conceptosFiltrados = useMemo(() => {
    let resultado = conceptos;

    // Filtro por tipo
    if (filtroModificados === "modificados") {
      resultado = resultado.filter(c => c.modificado || c.nuevo);
    } else if (filtroModificados === "originales") {
      resultado = resultado.filter(c => !c.modificado && !c.nuevo);
    }

    // Búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      resultado = resultado.filter(c =>
        c.id.toLowerCase().includes(termino) ||
        c.termino_preferido.toLowerCase().includes(termino) ||
        c.definicion.toLowerCase().includes(termino) ||
        (c.terminos_no_preferidos?.some(t => t.toLowerCase().includes(termino)))
      );
    }

    return resultado.sort((a, b) => a.id.localeCompare(b.id));
  }, [conceptos, busqueda, filtroModificados]);

  // Generar nuevo ID para concepto
  const generarNuevoId = () => {
    const ultimoId = conceptos
      .map(c => parseInt(c.id.replace(/\D/g, "")))
      .filter(n => !isNaN(n))
      .reduce((max, n) => Math.max(max, n), 0);

    return `C${String(ultimoId + 1).padStart(3, "0")}`;
  };

  // Manejar agregar nuevo concepto
  const handleAgregarConcepto = () => {
    const nuevoId = generarNuevoId();
    setFormData({
      id: nuevoId,
      termino_preferido: "",
      definicion: "",
      acronimo: "",
      terminos_no_preferidos: [],
      relaciones: {
        terminos_especificos: [],
        terminos_generales: [],
        terminos_relacionados: []
      },
      notas: [],
      ejemplos: [],
      nuevo: true
    });
    setVista("agregar");
  };

  // Manejar editar concepto
  const handleEditarConcepto = (concepto: ConceptoModificado) => {
    setFormData({ ...concepto });
    setConceptoSeleccionado(concepto);
    setVista("editar");
  };

  // Guardar concepto (nuevo o editado)
  const handleGuardarConcepto = () => {
    // Validaciones
    if (!formData.termino_preferido.trim()) {
      alert("El término preferido es obligatorio");
      return;
    }
    if (!formData.definicion.trim()) {
      alert("La definición es obligatoria");
      return;
    }

    // Convertir términos de las relaciones a IDs antes de guardar
    const formDataConvertido: ConceptoModificado = {
      ...formData,
      relaciones: {
        terminos_generales: (formData.relaciones?.terminos_generales || []).map(convertirAId),
        terminos_especificos: (formData.relaciones?.terminos_especificos || []).map(convertirAId),
        terminos_relacionados: (formData.relaciones?.terminos_relacionados || []).map(convertirAId)
      }
    };

    if (vista === "agregar") {
      // Agregar nuevo concepto
      const nuevoConcepto: ConceptoModificado = {
        ...formDataConvertido,
        nuevo: true,
        modificado: false
      };
      const nuevosConceptos = [...conceptos, nuevoConcepto];
      guardarModificaciones(nuevosConceptos);
      alert(`✅ Concepto ${nuevoConcepto.id} agregado exitosamente`);
    } else if (vista === "editar") {
      // Editar concepto existente
      const nuevosConceptos = conceptos.map(c =>
        c.id === formDataConvertido.id
          ? { ...formDataConvertido, modificado: !formDataConvertido.nuevo, nuevo: formDataConvertido.nuevo }
          : c
      );
      guardarModificaciones(nuevosConceptos);
      alert(`✅ Concepto ${formDataConvertido.id} actualizado exitosamente`);
    }

    setVista("lista");
    setFormData({
      id: "",
      termino_preferido: "",
      definicion: "",
      acronimo: "",
      terminos_no_preferidos: [],
      relaciones: {
        terminos_especificos: [],
        terminos_generales: [],
        terminos_relacionados: []
      },
      notas: [],
      ejemplos: []
    });
  };

  // Manejar eliminación de concepto (solo nuevos)
  const handleEliminarConcepto = (concepto: ConceptoModificado) => {
    if (!concepto.nuevo) {
      alert("No se pueden eliminar conceptos originales. Solo puedes editarlos.");
      return;
    }

    if (confirm(`¿Estás seguro de eliminar el concepto ${concepto.id} - ${concepto.termino_preferido}?`)) {
      const nuevosConceptos = conceptos.filter(c => c.id !== concepto.id);
      guardarModificaciones(nuevosConceptos);
      if (vista === "detalle" && conceptoSeleccionado?.id === concepto.id) {
        setVista("lista");
      }
    }
  };

  // Resetear modificaciones
  const handleResetearModificaciones = () => {
    if (confirm("¿Estás seguro de descartar TODAS las modificaciones y volver al tesauro original?")) {
      localStorage.removeItem("tesauro_modificaciones");
      if (tesauro) {
        setConceptos(tesauro.tesauro.conceptos.map(c => ({ ...c, modificado: false, nuevo: false })));
      }
      setVista("lista");
      alert("✅ Todas las modificaciones han sido descartadas");
    }
  };

  if (loadingTesauro) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "18px",
        color: "#666"
      }}>
        Cargando tesauro...
      </div>
    );
  }

  // VISTA: LISTA
  if (vista === "lista") {
    const conceptosModificadosCount = conceptos.filter(c => c.modificado || c.nuevo).length;

    return (
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "40px 20px",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"
      }}>
        {/* Header */}
        <div style={{ marginBottom: "30px" }}>
          <button
            onClick={onBack}
            style={{
              padding: "10px 20px",
              background: "#673ab7",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              marginBottom: "20px"
            }}
          >
            ← Volver a Gestión de Tesauros
          </button>

          <h1 style={{
            fontSize: "36px",
            marginBottom: "15px",
            color: "#673ab7",
            fontWeight: "bold"
          }}>
            📚 Editor de Tesauro
          </h1>
          <p style={{ fontSize: "16px", color: "#666" }}>
            Gestiona el diccionario de conceptos: {conceptos.length} conceptos totales
            {conceptosModificadosCount > 0 && (
              <span style={{ color: "#ff9800", fontWeight: "bold" }}>
                {" "}({conceptosModificadosCount} modificados/nuevos)
              </span>
            )}
          </p>
        </div>

        {/* Barra de herramientas */}
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>
          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Búsqueda */}
            <input
              type="text"
              placeholder="Buscar por ID, término o definición..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                flex: 1,
                minWidth: "250px",
                padding: "10px 15px",
                border: "2px solid #ddd",
                borderRadius: "8px",
                fontSize: "14px"
              }}
            />

            {/* Filtro */}
            <select
              value={filtroModificados}
              onChange={(e) => setFiltroModificados(e.target.value as any)}
              style={{
                padding: "10px 15px",
                border: "2px solid #ddd",
                borderRadius: "8px",
                fontSize: "14px",
                background: "white",
                cursor: "pointer"
              }}
            >
              <option value="todos">Todos los conceptos</option>
              <option value="originales">Solo originales</option>
              <option value="modificados">Solo modificados/nuevos</option>
            </select>

            {/* Botón agregar */}
            <button
              onClick={handleAgregarConcepto}
              style={{
                padding: "10px 20px",
                background: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold"
              }}
            >
              + Agregar Concepto
            </button>

            {/* Botón resetear */}
            {conceptosModificadosCount > 0 && (
              <button
                onClick={handleResetearModificaciones}
                style={{
                  padding: "10px 20px",
                  background: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold"
                }}
              >
                🔄 Resetear Todo
              </button>
            )}
          </div>

          <div style={{ marginTop: "15px", fontSize: "13px", color: "#666" }}>
            Mostrando {conceptosFiltrados.length} de {conceptos.length} conceptos
          </div>
        </div>

        {/* Lista de conceptos */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          overflow: "hidden"
        }}>
          <div style={{
            maxHeight: "calc(100vh - 400px)",
            overflowY: "auto"
          }}>
            {conceptosFiltrados.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
                No se encontraron conceptos
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                    <th style={{ padding: "15px", textAlign: "left", fontWeight: "bold" }}>ID</th>
                    <th style={{ padding: "15px", textAlign: "left", fontWeight: "bold" }}>Término</th>
                    <th style={{ padding: "15px", textAlign: "left", fontWeight: "bold" }}>Definición</th>
                    <th style={{ padding: "15px", textAlign: "left", fontWeight: "bold" }}>Estado</th>
                    <th style={{ padding: "15px", textAlign: "center", fontWeight: "bold" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {conceptosFiltrados.map((concepto) => (
                    <tr
                      key={concepto.id}
                      style={{
                        borderBottom: "1px solid #eee",
                        background: concepto.nuevo ? "#e8f5e9" : concepto.modificado ? "#fff3e0" : "white"
                      }}
                    >
                      <td style={{ padding: "15px", fontWeight: "bold", color: "#673ab7" }}>
                        {concepto.id}
                      </td>
                      <td style={{ padding: "15px" }}>
                        {concepto.termino_preferido}
                        {concepto.acronimo && (
                          <span style={{ color: "#999", fontSize: "12px", marginLeft: "5px" }}>
                            ({concepto.acronimo})
                          </span>
                        )}
                      </td>
                      <td style={{
                        padding: "15px",
                        maxWidth: "400px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {concepto.definicion}
                      </td>
                      <td style={{ padding: "15px" }}>
                        {concepto.nuevo && (
                          <span style={{
                            padding: "4px 8px",
                            background: "#4caf50",
                            color: "white",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "bold"
                          }}>
                            NUEVO
                          </span>
                        )}
                        {concepto.modificado && !concepto.nuevo && (
                          <span style={{
                            padding: "4px 8px",
                            background: "#ff9800",
                            color: "white",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "bold"
                          }}>
                            MODIFICADO
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "15px", textAlign: "center" }}>
                        <button
                          onClick={() => {
                            setConceptoSeleccionado(concepto);
                            setVista("detalle");
                          }}
                          style={{
                            padding: "6px 12px",
                            background: "#2196f3",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                            marginRight: "5px"
                          }}
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleEditarConcepto(concepto)}
                          style={{
                            padding: "6px 12px",
                            background: "#ff9800",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                            marginRight: "5px"
                          }}
                        >
                          Editar
                        </button>
                        {concepto.nuevo && (
                          <button
                            onClick={() => handleEliminarConcepto(concepto)}
                            style={{
                              padding: "6px 12px",
                              background: "#f44336",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px"
                            }}
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  // VISTA: DETALLE
  if (vista === "detalle" && conceptoSeleccionado) {
    return (
      <div style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "40px 20px",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"
      }}>
        <button
          onClick={() => setVista("lista")}
          style={{
            padding: "10px 20px",
            background: "#673ab7",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            marginBottom: "20px"
          }}
        >
          ← Volver a lista
        </button>

        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "30px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
        }}>
          {/* Header */}
          <div style={{ marginBottom: "30px", borderBottom: "2px solid #673ab7", paddingBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <h1 style={{ fontSize: "32px", color: "#673ab7", marginBottom: "10px" }}>
                  {conceptoSeleccionado.termino_preferido}
                </h1>
                <div style={{ fontSize: "16px", color: "#999" }}>
                  ID: {conceptoSeleccionado.id}
                  {conceptoSeleccionado.acronimo && ` • Acrónimo: ${conceptoSeleccionado.acronimo}`}
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                {(conceptoSeleccionado.nuevo || conceptoSeleccionado.modificado) && (
                  <span style={{
                    padding: "8px 16px",
                    background: conceptoSeleccionado.nuevo ? "#4caf50" : "#ff9800",
                    color: "white",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "bold"
                  }}>
                    {conceptoSeleccionado.nuevo ? "NUEVO" : "MODIFICADO"}
                  </span>
                )}
                <button
                  onClick={() => handleEditarConcepto(conceptoSeleccionado)}
                  style={{
                    padding: "8px 16px",
                    background: "#ff9800",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  ✏️ Editar
                </button>
              </div>
            </div>
          </div>

          {/* Definición */}
          <div style={{ marginBottom: "25px" }}>
            <h3 style={{ fontSize: "18px", color: "#333", marginBottom: "10px", fontWeight: "bold" }}>
              Definición
            </h3>
            <p style={{ fontSize: "15px", lineHeight: "1.8", color: "#555" }}>
              {conceptoSeleccionado.definicion}
            </p>
          </div>

          {/* Términos no preferidos */}
          {conceptoSeleccionado.terminos_no_preferidos && conceptoSeleccionado.terminos_no_preferidos.length > 0 && (
            <div style={{ marginBottom: "25px" }}>
              <h3 style={{ fontSize: "18px", color: "#333", marginBottom: "10px", fontWeight: "bold" }}>
                Términos no preferidos (Sinónimos)
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {conceptoSeleccionado.terminos_no_preferidos.map((termino, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: "6px 12px",
                      background: "#e3f2fd",
                      color: "#1976d2",
                      borderRadius: "16px",
                      fontSize: "13px"
                    }}
                  >
                    {termino}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Relaciones */}
          {conceptoSeleccionado.relaciones && (
            <div style={{ marginBottom: "25px" }}>
              <h3 style={{ fontSize: "18px", color: "#333", marginBottom: "15px", fontWeight: "bold" }}>
                Relaciones
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
                {conceptoSeleccionado.relaciones.terminos_generales && conceptoSeleccionado.relaciones.terminos_generales.length > 0 && (
                  <div>
                    <div style={{ fontWeight: "bold", color: "#666", marginBottom: "8px" }}>
                      Términos Generales:
                    </div>
                    {conceptoSeleccionado.relaciones.terminos_generales.map((t, idx) => (
                      <div key={idx} style={{ fontSize: "14px", color: "#555", marginBottom: "4px" }}>• {formatearRelacion(t)}</div>
                    ))}
                  </div>
                )}
                {conceptoSeleccionado.relaciones.terminos_especificos && conceptoSeleccionado.relaciones.terminos_especificos.length > 0 && (
                  <div>
                    <div style={{ fontWeight: "bold", color: "#666", marginBottom: "8px" }}>
                      Términos Específicos:
                    </div>
                    {conceptoSeleccionado.relaciones.terminos_especificos.map((t, idx) => (
                      <div key={idx} style={{ fontSize: "14px", color: "#555", marginBottom: "4px" }}>• {formatearRelacion(t)}</div>
                    ))}
                  </div>
                )}
                {conceptoSeleccionado.relaciones.terminos_relacionados && conceptoSeleccionado.relaciones.terminos_relacionados.length > 0 && (
                  <div>
                    <div style={{ fontWeight: "bold", color: "#666", marginBottom: "8px" }}>
                      Términos Relacionados:
                    </div>
                    {conceptoSeleccionado.relaciones.terminos_relacionados.map((t, idx) => (
                      <div key={idx} style={{ fontSize: "14px", color: "#555", marginBottom: "4px" }}>• {formatearRelacion(t)}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notas */}
          {conceptoSeleccionado.notas && conceptoSeleccionado.notas.length > 0 && (
            <div style={{ marginBottom: "25px" }}>
              <h3 style={{ fontSize: "18px", color: "#333", marginBottom: "10px", fontWeight: "bold" }}>
                Notas
              </h3>
              {conceptoSeleccionado.notas.map((nota, idx) => (
                <p key={idx} style={{ fontSize: "14px", color: "#666", marginBottom: "8px", paddingLeft: "20px" }}>
                  • {nota}
                </p>
              ))}
            </div>
          )}

          {/* Ejemplos */}
          {conceptoSeleccionado.ejemplos && conceptoSeleccionado.ejemplos.length > 0 && (
            <div style={{ marginBottom: "25px" }}>
              <h3 style={{ fontSize: "18px", color: "#333", marginBottom: "10px", fontWeight: "bold" }}>
                Ejemplos
              </h3>
              {conceptoSeleccionado.ejemplos.map((ejemplo, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px",
                    background: "#f5f5f5",
                    borderLeft: "4px solid #673ab7",
                    marginBottom: "10px",
                    fontSize: "14px",
                    color: "#555",
                    fontStyle: "italic"
                  }}
                >
                  {ejemplo}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // VISTA: FORMULARIO (Agregar/Editar)
  if (vista === "agregar" || vista === "editar") {
    return (
      <div style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 20px",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"
      }}>
        <button
          onClick={() => {
            setVista("lista");
            setFormData({
              id: "",
              termino_preferido: "",
              definicion: "",
              acronimo: "",
              terminos_no_preferidos: [],
              relaciones: {
                terminos_especificos: [],
                terminos_generales: [],
                terminos_relacionados: []
              },
              notas: [],
              ejemplos: []
            });
          }}
          style={{
            padding: "10px 20px",
            background: "#666",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            marginBottom: "20px"
          }}
        >
          ← Cancelar
        </button>

        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "30px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
        }}>
          <h1 style={{ fontSize: "28px", color: "#673ab7", marginBottom: "30px" }}>
            {vista === "agregar" ? "➕ Agregar Nuevo Concepto" : "✏️ Editar Concepto"}
          </h1>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* ID */}
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>
                ID *
              </label>
              <input
                type="text"
                value={formData.id}
                readOnly
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  background: "#f5f5f5",
                  cursor: "not-allowed"
                }}
              />
            </div>

            {/* Término preferido */}
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>
                Término Preferido * <span style={{ color: "#999", fontWeight: "normal", fontSize: "12px" }}>(obligatorio)</span>
              </label>
              <input
                type="text"
                value={formData.termino_preferido}
                onChange={(e) => setFormData({ ...formData, termino_preferido: e.target.value })}
                placeholder="Ej: Convenio Colectivo de Trabajo"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px"
                }}
              />
            </div>

            {/* Acrónimo */}
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>
                Acrónimo
              </label>
              <input
                type="text"
                value={formData.acronimo || ""}
                onChange={(e) => setFormData({ ...formData, acronimo: e.target.value })}
                placeholder="Ej: CCT"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px"
                }}
              />
            </div>

            {/* Definición */}
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>
                Definición * <span style={{ color: "#999", fontWeight: "normal", fontSize: "12px" }}>(obligatorio)</span>
              </label>
              <textarea
                value={formData.definicion}
                onChange={(e) => setFormData({ ...formData, definicion: e.target.value })}
                placeholder="Escribe la definición completa del concepto..."
                rows={5}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical"
                }}
              />
            </div>

            {/* Términos no preferidos */}
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>
                Términos no preferidos (Sinónimos)
              </label>
              <textarea
                value={(formData.terminos_no_preferidos || []).join("\n")}
                onChange={(e) => setFormData({
                  ...formData,
                  terminos_no_preferidos: e.target.value.split("\n").filter(t => t.trim())
                })}
                placeholder="Un término por línea..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical"
                }}
              />
            </div>

            {/* Relaciones */}
            <div style={{
              border: "2px solid #e0e0e0",
              borderRadius: "8px",
              padding: "20px",
              background: "#fafafa"
            }}>
              <h3 style={{ fontSize: "18px", marginBottom: "10px", color: "#673ab7" }}>
                Relaciones
              </h3>
              <p style={{
                fontSize: "12px",
                color: "#666",
                marginBottom: "15px",
                padding: "8px",
                background: "#fff3cd",
                borderRadius: "4px",
                border: "1px solid #ffc107"
              }}>
                💡 <strong>Tip:</strong> Escribí el término completo (ej: "Convenio Colectivo de Trabajo") o el ID (ej: "C001").
                El sistema mostrará siempre el término legible.
              </p>

              {/* Términos generales */}
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
                  Términos Generales
                  <span style={{ fontWeight: "normal", fontSize: "12px", color: "#999", marginLeft: "5px" }}>
                    (conceptos más amplios)
                  </span>
                </label>
                <textarea
                  value={(formData.relaciones?.terminos_generales || []).map(id => formatearRelacion(id)).join("\n")}
                  onChange={(e) => setFormData({
                    ...formData,
                    relaciones: {
                      ...formData.relaciones,
                      terminos_generales: e.target.value.split("\n").filter(t => t.trim())
                    }
                  })}
                  placeholder="Ej: Derecho Laboral&#10;Relaciones de trabajo&#10;Convenio Colectivo"
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "13px",
                    fontFamily: "inherit"
                  }}
                />
              </div>

              {/* Términos específicos */}
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
                  Términos Específicos
                  <span style={{ fontWeight: "normal", fontSize: "12px", color: "#999", marginLeft: "5px" }}>
                    (conceptos más detallados)
                  </span>
                </label>
                <textarea
                  value={(formData.relaciones?.terminos_especificos || []).map(id => formatearRelacion(id)).join("\n")}
                  onChange={(e) => setFormData({
                    ...formData,
                    relaciones: {
                      ...formData.relaciones,
                      terminos_especificos: e.target.value.split("\n").filter(t => t.trim())
                    }
                  })}
                  placeholder="Ej: Horas extras&#10;Licencias por enfermedad&#10;Vacaciones anuales"
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "13px",
                    fontFamily: "inherit"
                  }}
                />
              </div>

              {/* Términos relacionados */}
              <div>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
                  Términos Relacionados
                  <span style={{ fontWeight: "normal", fontSize: "12px", color: "#999", marginLeft: "5px" }}>
                    (conceptos asociados)
                  </span>
                </label>
                <textarea
                  value={(formData.relaciones?.terminos_relacionados || []).map(id => formatearRelacion(id)).join("\n")}
                  onChange={(e) => setFormData({
                    ...formData,
                    relaciones: {
                      ...formData.relaciones,
                      terminos_relacionados: e.target.value.split("\n").filter(t => t.trim())
                    }
                  })}
                  placeholder="Ej: Salario&#10;Jornada laboral&#10;Condiciones de trabajo"
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "13px",
                    fontFamily: "inherit"
                  }}
                />
              </div>
            </div>

            {/* Notas */}
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>
                Notas
              </label>
              <textarea
                value={(formData.notas || []).join("\n")}
                onChange={(e) => setFormData({
                  ...formData,
                  notas: e.target.value.split("\n").filter(n => n.trim())
                })}
                placeholder="Una nota por línea..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical"
                }}
              />
            </div>

            {/* Ejemplos */}
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>
                Ejemplos
              </label>
              <textarea
                value={(formData.ejemplos || []).join("\n")}
                onChange={(e) => setFormData({
                  ...formData,
                  ejemplos: e.target.value.split("\n").filter(e => e.trim())
                })}
                placeholder="Un ejemplo por línea..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical"
                }}
              />
            </div>

            {/* Botones */}
            <div style={{
              display: "flex",
              gap: "15px",
              marginTop: "20px",
              paddingTop: "20px",
              borderTop: "2px solid #e0e0e0"
            }}>
              <button
                onClick={handleGuardarConcepto}
                style={{
                  flex: 1,
                  padding: "15px",
                  background: "#4caf50",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold"
                }}
              >
                💾 Guardar Concepto
              </button>
              <button
                onClick={() => {
                  setVista("lista");
                  setFormData({
                    id: "",
                    termino_preferido: "",
                    definicion: "",
                    acronimo: "",
                    terminos_no_preferidos: [],
                    relaciones: {
                      terminos_especificos: [],
                      terminos_generales: [],
                      terminos_relacionados: []
                    },
                    notas: [],
                    ejemplos: []
                  });
                }}
                style={{
                  flex: 1,
                  padding: "15px",
                  background: "#666",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold"
                }}
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
