import { useState } from "react";

/**
 * Asistente de Redacción para CCTs
 * Analiza el texto, detecta conceptos del tesauro, y ofrece sugerencias
 */

interface ConceptoDetectado {
  concepto: {
    id: string;
    termino_preferido: string;
    definicion: string;
    categorias: string[];
  };
  occurrences: number;
  positions: Array<{ start: number; end: number; match: string }>;
}

interface AnalisisTexto {
  textLength: number;
  conceptsFound: number;
  concepts: ConceptoDetectado[];
  coverage: number;
}

interface AsistenteRedaccionProps {
  texto: string;
  onTextoChange: (nuevoTexto: string) => void;
}

export default function AsistenteRedaccion({ texto, onTextoChange }: AsistenteRedaccionProps) {
  const [analisis, setAnalisis] = useState<AnalisisTexto | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [conceptoSeleccionado, setConceptoSeleccionado] = useState<ConceptoDetectado | null>(null);

  const analizarTexto = async () => {
    if (!texto || texto.length < 50) {
      alert("El texto debe tener al menos 50 caracteres para analizar");
      return;
    }

    setAnalizando(true);
    setMostrarPanel(true);

    try {
      const res = await fetch("/api/tesauro-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: texto }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnalisis(data);
      } else {
        alert("Error analizando el texto");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error al conectar con el servidor");
    } finally {
      setAnalizando(false);
    }
  };

  const resaltarConcepto = (concepto: ConceptoDetectado) => {
    setConceptoSeleccionado(concepto);

    // Resaltar en el texto (scroll a la primera ocurrencia)
    if (concepto.positions.length > 0) {
      const primeraPosicion = concepto.positions[0];
      // TODO: Implementar scroll y resaltado visual
      console.log("Resaltar concepto en posición:", primeraPosicion);
    }
  };

  const sugerirTerminoPreferido = (concepto: ConceptoDetectado) => {
    if (!concepto.positions.length) return;

    let nuevoTexto = texto;

    // Reemplazar todas las ocurrencias con el término preferido
    // Recorrer de atrás hacia adelante para no alterar las posiciones
    const posicionesOrdenadas = [...concepto.positions].sort((a, b) => b.start - a.start);

    posicionesOrdenadas.forEach((pos) => {
      nuevoTexto =
        nuevoTexto.substring(0, pos.start) +
        concepto.concepto.termino_preferido +
        nuevoTexto.substring(pos.end);
    });

    onTextoChange(nuevoTexto);
    alert(`✅ Reemplazadas ${concepto.positions.length} ocurrencia(s) con el término preferido`);

    // Re-analizar
    setTimeout(() => analizarTexto(), 500);
  };

  const obtenerCoverageColor = (coverage: number) => {
    if (coverage >= 70) return "text-green-600";
    if (coverage >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const obtenerCoverageLabel = (coverage: number) => {
    if (coverage >= 70) return "Excelente";
    if (coverage >= 40) return "Buena";
    return "Mejorable";
  };

  return (
    <div className="space-y-4">
      {/* Botón de análisis */}
      <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div>
          <h3 className="font-semibold text-purple-900">🤖 Asistente de Redacción</h3>
          <p className="text-sm text-purple-700">
            Analiza el texto y detecta conceptos del tesauro para mejorar la consistencia terminológica
          </p>
        </div>
        <button
          onClick={analizarTexto}
          disabled={analizando || !texto || texto.length < 50}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold"
        >
          {analizando ? "Analizando..." : "Analizar Texto"}
        </button>
      </div>

      {/* Panel de resultados */}
      {mostrarPanel && analisis && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Header del panel */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">Análisis del Texto</h3>
              <button
                onClick={() => setMostrarPanel(false)}
                className="text-white hover:bg-white/20 rounded px-3 py-1"
              >
                ✕ Cerrar
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-sm opacity-90">Palabras</div>
                <div className="text-3xl font-bold">{Math.round(analisis.textLength / 5)}</div>
              </div>

              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-sm opacity-90">Conceptos Detectados</div>
                <div className="text-3xl font-bold">{analisis.conceptsFound}</div>
              </div>

              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-sm opacity-90">Cobertura del Tesauro</div>
                <div className={`text-3xl font-bold ${obtenerCoverageColor(analisis.coverage)}`}>
                  {analisis.coverage}%
                </div>
              </div>

              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-sm opacity-90">Calificación</div>
                <div className="text-3xl font-bold">{obtenerCoverageLabel(analisis.coverage)}</div>
              </div>
            </div>
          </div>

          {/* Lista de conceptos detectados */}
          <div className="bg-white">
            {analisis.conceptsFound === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg mb-2">No se detectaron conceptos del tesauro</p>
                <p className="text-sm">
                  Considera usar términos más específicos o agregar nuevos conceptos al tesauro
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {analisis.concepts.map((concepto, idx) => (
                  <div
                    key={idx}
                    className={`p-4 hover:bg-gray-50 transition ${
                      conceptoSeleccionado?.concepto.id === concepto.concepto.id
                        ? "bg-blue-50"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-blue-700">
                            {concepto.concepto.termino_preferido}
                          </h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                            {concepto.occurrences} vez{concepto.occurrences !== 1 ? "ces" : ""}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">{concepto.concepto.definicion}</p>

                        {concepto.concepto.categorias.length > 0 && (
                          <div className="flex gap-1 mb-3">
                            {concepto.concepto.categorias.map((cat) => (
                              <span key={cat} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Variantes encontradas */}
                        <div className="mb-2">
                          <div className="text-xs text-gray-500 font-semibold mb-1">
                            Variantes encontradas:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {concepto.positions.map((pos, pIdx) => (
                              <span
                                key={pIdx}
                                className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-mono"
                              >
                                "{pos.match}"
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => resaltarConcepto(concepto)}
                            className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            👁️ Ver en texto
                          </button>

                          <button
                            onClick={() => sugerirTerminoPreferido(concepto)}
                            className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            ✓ Usar término preferido
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recomendaciones */}
          <div className="bg-gray-50 border-t border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-3">💡 Recomendaciones:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              {analisis.coverage < 40 && (
                <li className="flex items-start gap-2">
                  <span className="text-red-500">⚠️</span>
                  <span>
                    La cobertura del tesauro es baja. Considera usar más términos técnicos o agregar nuevos conceptos al tesauro.
                  </span>
                </li>
              )}

              {analisis.conceptsFound > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>
                    Se detectaron {analisis.conceptsFound} conceptos del tesauro. Verifica que se usen los términos preferidos.
                  </span>
                </li>
              )}

              <li className="flex items-start gap-2">
                <span className="text-blue-500">ℹ️</span>
                <span>
                  Usa el autocompletado mientras escribes para sugerir términos del tesauro en tiempo real.
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
