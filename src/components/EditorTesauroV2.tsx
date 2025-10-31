import { useState, useEffect, useCallback } from "react";
import TesauroGraphView from "./TesauroGraphView";
import TesauroDashboard from "./TesauroDashboard";

/**
 * Editor de Tesauro V2 - Interfaz mejorada siguiendo mejores prácticas UX
 *
 * Implementa patrones de diseño basados en:
 * - SKOS (Simple Knowledge Organization System) - W3C
 * - Skosmos y SKOS Play! (herramientas de referencia)
 * - Metodologías UX para ontologías y tesauros
 *
 * Características:
 * - Vista alfabética (índice de conceptos)
 * - Vista jerárquica (árbol de relaciones)
 * - Búsqueda fuzzy con autocompletado en tiempo real
 * - Página individual por concepto
 * - Navegación bidireccional
 * - Almacenamiento en DynamoDB
 */

interface ConceptoEnriquecido {
  id: string;
  termino_preferido: string;
  acronimo?: string;
  terminos_no_preferidos: string[];
  definicion: string;
  categorias: string[];
  etiquetas: string[];
  sector_aplicacion: "general" | "específico" | "sectorial";
  marco_legal: {
    leyes: Array<{ nombre: string; articulo?: string; link?: string }>;
    jurisprudencia?: Array<{ fallo: string; año: number; sintesis: string }>;
  };
  relaciones: {
    terminos_especificos: string[];
    terminos_generales: string[];
    es_parte_de: string[];
    tiene_partes: string[];
    causa: string[];
    es_causado_por: string[];
    precede_a: string[];
    sigue_a: string[];
    regulado_por: string[];
    regula_a: string[];
    requiere: string[];
    es_requerido_por: string[];
    terminos_relacionados: string[];
    similar_a: string[];
    opuesto_a: string[];
  };
  es_cuantificable: boolean;
  unidad_medida?: string;
  formula_calculo?: string;
  rango_valores?: { minimo?: number; maximo?: number };
  version: number;
  fecha_creacion: string;
  fecha_modificacion: string;
  modificado_por: string;
  estado: "activo" | "obsoleto" | "propuesto";
  notas?: string[];
  ejemplos?: string[];
  _matchScore?: number;
}

type VistaMode = "alfabetica" | "jerarquica" | "grafo" | "concepto" | "busqueda" | "dashboard";

interface EditorTesauroV2Props {
  onBack: () => void;
  userName: string;
}

export default function EditorTesauroV2({ onBack, userName }: EditorTesauroV2Props) {
  const [modo, setModo] = useState<VistaMode>("alfabetica");
  const [conceptos, setConceptos] = useState<ConceptoEnriquecido[]>([]);
  const [conceptoActual, setConceptoActual] = useState<ConceptoEnriquecido | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ConceptoEnriquecido[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Navegación
  const [historial, setHistorial] = useState<string[]>([]);

  // Alfabético
  const [letraActual, setLetraActual] = useState<string>("A");

  // Jerárquico
  const [nodoExpandido, setNodoExpandido] = useState<Set<string>>(new Set());

  // Cargar conceptos inicialmente
  useEffect(() => {
    cargarConceptos();
  }, []);

  const cargarConceptos = async () => {
    setLoading(true);
    setError(null);

    try {
      // Intentar cargar desde API (producción)
      const res = await fetch("/api/tesauro?version=v1");

      // Si falla o retorna HTML/JS (desarrollo local), usar JSON local
      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType?.includes("application/json")) {
        console.log("API no disponible, cargando desde JSON local...");

        // Cargar desde JSON local
        const resLocal = await fetch("/tesauro_convenios_colectivos.json");
        const tesauroLocal = await resLocal.json();

        // Convertir al formato enriquecido
        const conceptosLocal = tesauroLocal.tesauro.conceptos.map((c: any) => ({
          ...c,
          categorias: c.categorias || [],
          etiquetas: [],
          sector_aplicacion: "general",
          marco_legal: { leyes: [], jurisprudencia: [] },
          relaciones: {
            ...c.relaciones,
            es_parte_de: [],
            tiene_partes: [],
            causa: [],
            es_causado_por: [],
            precede_a: [],
            sigue_a: [],
            regulado_por: [],
            regula_a: [],
            requiere: [],
            es_requerido_por: [],
            similar_a: [],
            opuesto_a: [],
          },
          es_cuantificable: false,
          version: 1,
          fecha_creacion: new Date().toISOString(),
          fecha_modificacion: new Date().toISOString(),
          modificado_por: "local",
          estado: "activo",
        }));

        setConceptos(conceptosLocal);
        return;
      }

      const data = await res.json();
      setConceptos(data.conceptos || []);
    } catch (err) {
      console.error("Error cargando conceptos:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Búsqueda fuzzy con debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);

      try {
        const res = await fetch(
          `/api/tesauro-search?q=${encodeURIComponent(searchQuery)}&limit=20`
        );

        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.error("Error en búsqueda:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const navegarAConcepto = useCallback(
    (conceptoId: string) => {
      // Buscar el concepto en memoria en lugar de hacer fetch
      const concepto = conceptos.find((c) => c.id === conceptoId);

      if (!concepto) {
        alert(`Concepto no encontrado: ${conceptoId}`);
        return;
      }

      // Agregar al historial
      if (conceptoActual) {
        setHistorial((prev) => [...prev, conceptoActual.id]);
      }

      setConceptoActual(concepto);
      setModo("concepto");
    },
    [conceptos, conceptoActual]
  );

  const volverAtras = () => {
    if (historial.length > 0) {
      const anteriorId = historial[historial.length - 1];
      setHistorial((prev) => prev.slice(0, -1));
      navegarAConcepto(anteriorId);
    } else {
      setModo("alfabetica");
      setConceptoActual(null);
    }
  };

  const toggleNodo = (id: string) => {
    setNodoExpandido((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) {
        nuevo.delete(id);
      } else {
        nuevo.add(id);
      }
      return nuevo;
    });
  };

  // ==================== VISTA ALFABÉTICA ====================
  const renderVistaAlfabetica = () => {
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const conceptosPorLetra = conceptos
      .filter((c) => c.estado === "activo")
      .filter((c) => c.termino_preferido[0].toUpperCase() === letraActual)
      .sort((a, b) => a.termino_preferido.localeCompare(b.termino_preferido));

    return (
      <div className="flex h-full overflow-hidden">
        {/* Índice alfabético */}
        <div className="w-20 bg-gray-50 border-r border-gray-200 p-2 overflow-y-auto flex-shrink-0">
          <div className="text-xs font-semibold text-gray-500 mb-2">Letra</div>
          {letras.map((letra) => {
            const count = conceptos.filter(
              (c) => c.estado === "activo" && c.termino_preferido[0].toUpperCase() === letra
            ).length;

            return (
              <button
                key={letra}
                onClick={() => setLetraActual(letra)}
                disabled={count === 0}
                className={`
                  w-full text-left px-2 py-1 mb-1 rounded text-sm
                  ${letraActual === letra ? "bg-blue-500 text-white font-bold" : ""}
                  ${count === 0 ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-200"}
                `}
              >
                {letra}
              </button>
            );
          })}
        </div>

        {/* Lista de conceptos */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">Conceptos con letra "{letraActual}"</h2>

          {conceptosPorLetra.length === 0 ? (
            <p className="text-gray-500">No hay conceptos que empiecen con "{letraActual}"</p>
          ) : (
            <div className="space-y-2">
              {conceptosPorLetra.map((concepto) => (
                <button
                  key={concepto.id}
                  onClick={() => navegarAConcepto(concepto.id)}
                  className="w-full text-left p-3 border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition"
                >
                  <div className="font-semibold text-blue-600">
                    {concepto.termino_preferido}
                    {concepto.acronimo && (
                      <span className="ml-2 text-sm text-gray-500">({concepto.acronimo})</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {concepto.definicion}
                  </div>
                  {concepto.categorias.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {concepto.categorias.map((cat) => (
                        <span
                          key={cat}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==================== VISTA JERÁRQUICA ====================
  const renderVistaJerarquica = () => {
    // Encontrar conceptos raíz (sin términos generales)
    const raices = conceptos.filter(
      (c) => c.estado === "activo" && c.relaciones.terminos_generales.length === 0
    );

    const renderNodo = (concepto: ConceptoEnriquecido, nivel: number = 0) => {
      const tieneHijos = concepto.relaciones.terminos_especificos.length > 0;
      const expandido = nodoExpandido.has(concepto.id);
      const hijos = conceptos.filter((c) =>
        concepto.relaciones.terminos_especificos.includes(c.id)
      );

      return (
        <div key={concepto.id} style={{ marginLeft: `${nivel * 20}px` }}>
          <div className="flex items-center gap-2 py-1">
            {tieneHijos && (
              <button
                onClick={() => toggleNodo(concepto.id)}
                className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded"
              >
                {expandido ? "−" : "+"}
              </button>
            )}
            {!tieneHijos && <div className="w-5" />}
            <button
              onClick={() => navegarAConcepto(concepto.id)}
              className="flex-1 text-left px-2 py-1 hover:bg-blue-50 rounded"
            >
              <span className="text-blue-600 font-medium">{concepto.termino_preferido}</span>
            </button>
          </div>
          {expandido && tieneHijos && (
            <div>{hijos.map((hijo) => renderNodo(hijo, nivel + 1))}</div>
          )}
        </div>
      );
    };

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Jerarquía de Conceptos</h2>
        <div className="bg-white border border-gray-200 rounded p-4">
          {raices.length === 0 ? (
            <p className="text-gray-500">No hay conceptos raíz</p>
          ) : (
            raices.map((raiz) => renderNodo(raiz))
          )}
        </div>
      </div>
    );
  };

  // ==================== VISTA DE CONCEPTO INDIVIDUAL ====================
  const renderVistaConcepto = () => {
    if (!conceptoActual) return null;

    const relacionesTipo = [
      { key: "terminos_generales", label: "Términos más generales", icon: "↑" },
      { key: "terminos_especificos", label: "Términos más específicos", icon: "↓" },
      { key: "es_parte_de", label: "Es parte de", icon: "⊂" },
      { key: "tiene_partes", label: "Tiene partes", icon: "⊃" },
      { key: "requiere", label: "Requiere", icon: "⚠" },
      { key: "regulado_por", label: "Regulado por", icon: "§" },
      { key: "precede_a", label: "Precede a", icon: "→" },
      { key: "terminos_relacionados", label: "Términos relacionados", icon: "↔" },
    ];

    return (
      <div className="p-6">
        {/* Breadcrumb / Navegación */}
        <div className="mb-4 flex items-center gap-2 text-sm">
          <button onClick={volverAtras} className="text-blue-600 hover:underline">
            ← Volver
          </button>
          {historial.length > 0 && (
            <span className="text-gray-400">
              | {historial.length} concepto(s) en historial
            </span>
          )}
        </div>

        {/* Encabezado del concepto */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {conceptoActual.termino_preferido}
          </h1>

          {conceptoActual.acronimo && (
            <div className="text-lg text-gray-600 mb-2">
              Acrónimo: <span className="font-semibold">{conceptoActual.acronimo}</span>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {conceptoActual.id}
            </span>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              {conceptoActual.estado}
            </span>
            {conceptoActual.es_cuantificable && (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                Cuantificable {conceptoActual.unidad_medida && `(${conceptoActual.unidad_medida})`}
              </span>
            )}
          </div>

          {/* Categorías */}
          {conceptoActual.categorias.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-semibold text-gray-700 mb-1">Categorías:</div>
              <div className="flex flex-wrap gap-2">
                {conceptoActual.categorias.map((cat) => (
                  <span key={cat} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Definición */}
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-700 mb-1">Definición:</div>
            <p className="text-gray-800">{conceptoActual.definicion}</p>
          </div>

          {/* Términos no preferidos */}
          {conceptoActual.terminos_no_preferidos.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-semibold text-gray-700 mb-1">
                Usar en lugar de (términos no preferidos):
              </div>
              <div className="flex flex-wrap gap-2">
                {conceptoActual.terminos_no_preferidos.map((term, idx) => (
                  <span key={idx} className="text-sm italic text-gray-600">
                    "{term}"
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Marco Legal */}
        {conceptoActual.marco_legal.leyes.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">📖 Marco Legal</h3>
            <ul className="space-y-2">
              {conceptoActual.marco_legal.leyes.map((ley, idx) => (
                <li key={idx} className="text-gray-800">
                  <span className="font-semibold">{ley.nombre}</span>
                  {ley.articulo && <span className="text-gray-600"> - {ley.articulo}</span>}
                  {ley.link && (
                    <a
                      href={ley.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline text-sm"
                    >
                      Ver ley →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Relaciones Semánticas */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🔗 Relaciones Semánticas</h3>

          {relacionesTipo.map(({ key, label, icon }) => {
            const relaciones = conceptoActual.relaciones[key as keyof typeof conceptoActual.relaciones];

            if (!relaciones || relaciones.length === 0) return null;

            return (
              <div key={key} className="mb-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  {icon} {label}:
                </div>
                <div className="space-y-1">
                  {relaciones.map((relacionId: string) => {
                    const relacionConcepto = conceptos.find((c) => c.id === relacionId);
                    return (
                      <button
                        key={relacionId}
                        onClick={() => navegarAConcepto(relacionId)}
                        className="block w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded text-blue-700 font-medium"
                      >
                        {relacionConcepto?.termino_preferido || relacionId}
                        <span className="text-xs text-gray-500 ml-2">({relacionId})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Notas y Ejemplos */}
        {(conceptoActual.notas && conceptoActual.notas.length > 0) && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">📝 Notas</h3>
            <ul className="list-disc list-inside space-y-1">
              {conceptoActual.notas.map((nota, idx) => (
                <li key={idx} className="text-gray-700">
                  {nota}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Metadatos */}
        <div className="text-xs text-gray-500 border-t pt-4">
          <div>Versión: {conceptoActual.version}</div>
          <div>Creado: {new Date(conceptoActual.fecha_creacion).toLocaleString()}</div>
          <div>Modificado: {new Date(conceptoActual.fecha_modificacion).toLocaleString()}</div>
          <div>Por: {conceptoActual.modificado_por}</div>
        </div>
      </div>
    );
  };

  // ==================== VISTA DE BÚSQUEDA ====================
  const renderVistaBusqueda = () => {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Búsqueda de Conceptos</h2>

        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conceptos... (búsqueda fuzzy)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchLoading && (
            <p className="text-sm text-gray-500 mt-2">Buscando...</p>
          )}
        </div>

        {searchResults.length > 0 ? (
          <div className="space-y-3">
            {searchResults.map((concepto) => (
              <button
                key={concepto.id}
                onClick={() => navegarAConcepto(concepto.id)}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-blue-600">
                      {concepto.termino_preferido}
                      {concepto.acronimo && (
                        <span className="ml-2 text-sm text-gray-500">({concepto.acronimo})</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {concepto.definicion}
                    </div>
                    {concepto.categorias.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {concepto.categorias.map((cat) => (
                          <span
                            key={cat}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {concepto._matchScore && (
                    <div className="ml-4 text-xs text-gray-500">
                      Match: {Math.round(concepto._matchScore)}%
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : searchQuery.trim() !== "" && !searchLoading ? (
          <p className="text-gray-500">No se encontraron resultados para "{searchQuery}"</p>
        ) : null}
      </div>
    );
  };

  // ==================== RENDER PRINCIPAL ====================
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tesauro de CCT - V2.2 ✅ CLICK ARREGLADO</h1>
          <p className="text-sm text-gray-300">
            {conceptos.length} conceptos activos | Usuario: {userName}
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
        >
          ← Volver al Hub
        </button>
      </div>

      {/* Barra de navegación de modos */}
      <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 flex gap-2">
        <button
          onClick={() => setModo("alfabetica")}
          className={`px-4 py-2 rounded ${
            modo === "alfabetica" ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-200"
          }`}
        >
          📖 Alfabética
        </button>
        <button
          onClick={() => setModo("jerarquica")}
          className={`px-4 py-2 rounded ${
            modo === "jerarquica" ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-200"
          }`}
        >
          🌳 Jerárquica
        </button>
        <button
          onClick={() => setModo("grafo")}
          className={`px-4 py-2 rounded ${
            modo === "grafo" ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-200"
          }`}
        >
          🕸️ Grafo
        </button>
        <button
          onClick={() => setModo("busqueda")}
          className={`px-4 py-2 rounded ${
            modo === "busqueda" ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-200"
          }`}
        >
          🔍 Búsqueda
        </button>
        <button
          onClick={() => setModo("dashboard")}
          className={`px-4 py-2 rounded ${
            modo === "dashboard" ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-200"
          }`}
        >
          📊 Dashboard
        </button>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {loading && !conceptoActual && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Cargando...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-800 font-semibold">Error:</p>
              <p className="text-red-600">{error}</p>
              <button
                onClick={cargarConceptos}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {modo === "alfabetica" && renderVistaAlfabetica()}
            {modo === "jerarquica" && renderVistaJerarquica()}
            {modo === "grafo" && (
              <TesauroGraphView
                conceptos={conceptos}
                conceptoRaiz={conceptoActual?.id}
                onNodeClick={navegarAConcepto}
                maxDepth={2}
              />
            )}
            {modo === "concepto" && renderVistaConcepto()}
            {modo === "busqueda" && renderVistaBusqueda()}
            {modo === "dashboard" && <TesauroDashboard conceptos={conceptos} />}
          </>
        )}
      </div>
    </div>
  );
}
