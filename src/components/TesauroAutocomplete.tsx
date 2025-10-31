import { useState, useEffect, useRef } from "react";

/**
 * Componente de autocompletado inteligente que sugiere conceptos del tesauro
 * Se integra con cualquier input/textarea del editor CCT
 *
 * Uso:
 * <TesauroAutocomplete
 *   value={texto}
 *   onChange={(nuevoTexto) => setTexto(nuevoTexto)}
 *   onConceptSelect={(concepto) => console.log(concepto)}
 * />
 */

interface ConceptoSugerido {
  id: string;
  termino_preferido: string;
  definicion: string;
  categorias: string[];
  _matchScore?: number;
}

interface TesauroAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onConceptSelect?: (concepto: ConceptoSugerido) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
  label?: string;
}

export default function TesauroAutocomplete({
  value,
  onChange,
  onConceptSelect,
  placeholder = "Escribe aquí...",
  multiline = false,
  rows = 4,
  className = "",
  label,
}: TesauroAutocompleteProps) {
  const [sugerencias, setSugerencias] = useState<ConceptoSugerido[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [seleccionIndex, setSeleccionIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const sugerenciasRef = useRef<HTMLDivElement>(null);

  // Detectar palabra actual bajo el cursor
  const getPalabraActual = () => {
    if (!inputRef.current) return null;

    const cursorPos = inputRef.current.selectionStart || 0;
    const texto = value;

    // Buscar inicio de la palabra (retroceder hasta espacio o inicio)
    let inicio = cursorPos;
    while (inicio > 0 && !/\s/.test(texto[inicio - 1])) {
      inicio--;
    }

    // Buscar fin de la palabra (avanzar hasta espacio o fin)
    let fin = cursorPos;
    while (fin < texto.length && !/\s/.test(texto[fin])) {
      fin++;
    }

    const palabra = texto.substring(inicio, fin);

    return palabra.length >= 3 ? { palabra, inicio, fin } : null;
  };

  // Buscar sugerencias en el tesauro
  useEffect(() => {
    const palabraInfo = getPalabraActual();

    if (!palabraInfo) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    const { palabra } = palabraInfo;

    const buscarSugerencias = async () => {
      setLoading(true);

      try {
        const res = await fetch(
          `/api/tesauro-search?q=${encodeURIComponent(palabra)}&limit=8`
        );

        if (res.ok) {
          const data = await res.json();
          setSugerencias(data.results || []);
          setMostrarSugerencias(data.results?.length > 0);
          setSeleccionIndex(0);
        }
      } catch (err) {
        console.error("Error buscando sugerencias:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(buscarSugerencias, 300);

    return () => clearTimeout(timer);
  }, [value]);

  // Seleccionar una sugerencia
  const seleccionarSugerencia = (concepto: ConceptoSugerido) => {
    const palabraInfo = getPalabraActual();

    if (!palabraInfo) return;

    const { inicio, fin } = palabraInfo;

    // Reemplazar la palabra parcial con el término completo
    const nuevoTexto =
      value.substring(0, inicio) +
      concepto.termino_preferido +
      value.substring(fin);

    onChange(nuevoTexto);
    setMostrarSugerencias(false);

    // Callback opcional
    if (onConceptSelect) {
      onConceptSelect(concepto);
    }

    // Foco de vuelta al input
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Manejo de teclas
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!mostrarSugerencias || sugerencias.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSeleccionIndex((prev) => Math.min(prev + 1, sugerencias.length - 1));
        break;

      case "ArrowUp":
        e.preventDefault();
        setSeleccionIndex((prev) => Math.max(prev - 1, 0));
        break;

      case "Enter":
        if (mostrarSugerencias) {
          e.preventDefault();
          seleccionarSugerencia(sugerencias[seleccionIndex]);
        }
        break;

      case "Escape":
        e.preventDefault();
        setMostrarSugerencias(false);
        break;
    }
  };

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sugerenciasRef.current &&
        !sugerenciasRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setMostrarSugerencias(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {multiline ? (
        <textarea
          ref={inputRef as React.Ref<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        />
      ) : (
        <input
          ref={inputRef as React.Ref<HTMLInputElement>}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        />
      )}

      {/* Panel de sugerencias */}
      {mostrarSugerencias && (
        <div
          ref={sugerenciasRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {loading ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              Buscando conceptos...
            </div>
          ) : sugerencias.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No se encontraron conceptos
            </div>
          ) : (
            <>
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-600 font-semibold">
                💡 Conceptos del Tesauro (↑↓ para navegar, Enter para seleccionar)
              </div>

              {sugerencias.map((concepto, idx) => (
                <button
                  key={concepto.id}
                  onClick={() => seleccionarSugerencia(concepto)}
                  className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition ${
                    idx === seleccionIndex ? "bg-blue-100" : ""
                  } ${idx !== 0 ? "border-t border-gray-100" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-blue-700 mb-1">
                        {concepto.termino_preferido}
                      </div>
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {concepto.definicion}
                      </div>
                      {concepto.categorias.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {concepto.categorias.slice(0, 3).map((cat) => (
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
                      <div className="ml-2 text-xs text-gray-500 flex-shrink-0">
                        {Math.round(concepto._matchScore)}%
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* Indicador de ayuda */}
      {!mostrarSugerencias && (
        <div className="mt-1 text-xs text-gray-500">
          💡 Escribe al menos 3 letras para ver sugerencias del tesauro
        </div>
      )}
    </div>
  );
}
