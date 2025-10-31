import { useState, useEffect } from "react";

/**
 * Dashboard de Analytics y Métricas del Tesauro
 * Muestra estadísticas sobre conceptos, relaciones, uso, y calidad
 */

interface ConceptoStats {
  id: string;
  termino_preferido: string;
  total_relaciones: number;
  categorias: string[];
}

interface DashboardData {
  totalConceptos: number;
  conceptosPorCategoria: Record<string, number>;
  conceptosPorEstado: Record<string, number>;
  conceptosCuantificables: number;
  relacionesTotales: number;
  relacionesPorTipo: Record<string, number>;
  conceptosMasConectados: ConceptoStats[];
  conceptosHuerfanos: ConceptoStats[];
  categoriasMasUsadas: Array<{ categoria: string; count: number }>;
}

interface TesauroDashboardProps {
  conceptos: any[];
}

export default function TesauroDashboard({ conceptos }: TesauroDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (conceptos && conceptos.length > 0) {
      const stats = calcularEstadisticas(conceptos);
      setData(stats);
      setLoading(false);
    }
  }, [conceptos]);

  const calcularEstadisticas = (conceptos: any[]): DashboardData => {
    const totalConceptos = conceptos.length;

    // Conceptos por categoría
    const conceptosPorCategoria: Record<string, number> = {};
    conceptos.forEach((c) => {
      c.categorias?.forEach((cat: string) => {
        conceptosPorCategoria[cat] = (conceptosPorCategoria[cat] || 0) + 1;
      });
    });

    // Conceptos por estado
    const conceptosPorEstado: Record<string, number> = {};
    conceptos.forEach((c) => {
      const estado = c.estado || "activo";
      conceptosPorEstado[estado] = (conceptosPorEstado[estado] || 0) + 1;
    });

    // Conceptos cuantificables
    const conceptosCuantificables = conceptos.filter((c) => c.es_cuantificable).length;

    // Relaciones totales y por tipo
    let relacionesTotales = 0;
    const relacionesPorTipo: Record<string, number> = {};

    conceptos.forEach((c) => {
      if (c.relaciones) {
        Object.entries(c.relaciones).forEach(([tipo, ids]: [string, any]) => {
          const count = Array.isArray(ids) ? ids.length : 0;
          relacionesTotales += count;
          relacionesPorTipo[tipo] = (relacionesPorTipo[tipo] || 0) + count;
        });
      }
    });

    // Conceptos más conectados
    const conceptosConStats: ConceptoStats[] = conceptos.map((c) => {
      let totalRelaciones = 0;

      if (c.relaciones) {
        Object.values(c.relaciones).forEach((ids: any) => {
          totalRelaciones += Array.isArray(ids) ? ids.length : 0;
        });
      }

      return {
        id: c.id,
        termino_preferido: c.termino_preferido,
        total_relaciones: totalRelaciones,
        categorias: c.categorias || [],
      };
    });

    const conceptosMasConectados = conceptosConStats
      .sort((a, b) => b.total_relaciones - a.total_relaciones)
      .slice(0, 10);

    // Conceptos huérfanos (sin relaciones)
    const conceptosHuerfanos = conceptosConStats
      .filter((c) => c.total_relaciones === 0)
      .slice(0, 10);

    // Categorías más usadas
    const categoriasMasUsadas = Object.entries(conceptosPorCategoria)
      .map(([categoria, count]) => ({ categoria, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalConceptos,
      conceptosPorCategoria,
      conceptosPorEstado,
      conceptosCuantificables,
      relacionesTotales,
      relacionesPorTipo,
      conceptosMasConectados,
      conceptosHuerfanos,
      categoriasMasUsadas,
    };
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Calculando estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">📊 Dashboard de Tesauro</h1>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Total de Conceptos</div>
            <div className="text-4xl font-bold text-blue-600">{data.totalConceptos}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Relaciones Totales</div>
            <div className="text-4xl font-bold text-green-600">{data.relacionesTotales}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Cuantificables</div>
            <div className="text-4xl font-bold text-purple-600">{data.conceptosCuantificables}</div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round((data.conceptosCuantificables / data.totalConceptos) * 100)}% del total
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Categorías</div>
            <div className="text-4xl font-bold text-orange-600">
              {Object.keys(data.conceptosPorCategoria).length}
            </div>
          </div>
        </div>

        {/* Gráficos y tablas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Conceptos por estado */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Conceptos por Estado</h3>
            <div className="space-y-3">
              {Object.entries(data.conceptosPorEstado).map(([estado, count]) => (
                <div key={estado}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium capitalize">{estado}</span>
                    <span className="text-gray-600">
                      {count} ({Math.round((count / data.totalConceptos) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(count / data.totalConceptos) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Relaciones por tipo */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Relaciones por Tipo</h3>
            <div className="space-y-3">
              {Object.entries(data.relacionesPorTipo)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([tipo, count]) => (
                  <div key={tipo}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{tipo.replace(/_/g, " ")}</span>
                      <span className="text-gray-600">
                        {count} ({Math.round((count / data.relacionesTotales) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(count / data.relacionesTotales) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Categorías más usadas */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 Categorías</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {data.categoriasMasUsadas.map((cat) => (
              <div key={cat.categoria} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{cat.count}</div>
                <div className="text-xs text-gray-600 mt-1">{cat.categoria}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Conceptos más conectados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🌟 Conceptos Más Conectados</h3>
            <div className="space-y-2">
              {data.conceptosMasConectados.map((concepto, idx) => (
                <div key={concepto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">{idx + 1}</span>
                    <div>
                      <div className="font-medium text-gray-900">{concepto.termino_preferido}</div>
                      <div className="text-xs text-gray-500">{concepto.id}</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    {concepto.total_relaciones} relaciones
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">⚠️ Conceptos Huérfanos (Sin Relaciones)</h3>
            {data.conceptosHuerfanos.length === 0 ? (
              <p className="text-green-600 font-medium">¡Excelente! No hay conceptos huérfanos</p>
            ) : (
              <div className="space-y-2">
                {data.conceptosHuerfanos.map((concepto) => (
                  <div key={concepto.id} className="p-3 bg-yellow-50 rounded">
                    <div className="font-medium text-gray-900">{concepto.termino_preferido}</div>
                    <div className="text-xs text-gray-500">{concepto.id}</div>
                    {concepto.categorias.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {concepto.categorias.map((cat) => (
                          <span key={cat} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Indicadores de calidad */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-2xl font-bold mb-4">🎯 Indicadores de Calidad</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm opacity-90 mb-1">Densidad de Relaciones</div>
              <div className="text-3xl font-bold">
                {(data.relacionesTotales / data.totalConceptos).toFixed(2)}
              </div>
              <div className="text-xs opacity-75 mt-1">relaciones por concepto</div>
            </div>

            <div>
              <div className="text-sm opacity-90 mb-1">Cobertura de Categorización</div>
              <div className="text-3xl font-bold">
                {Math.round(
                  (Object.values(data.conceptosPorCategoria).reduce((a, b) => a + b, 0) /
                    data.totalConceptos) *
                    100
                )}
                %
              </div>
              <div className="text-xs opacity-75 mt-1">conceptos categorizados</div>
            </div>

            <div>
              <div className="text-sm opacity-90 mb-1">Tasa de Huérfanos</div>
              <div className="text-3xl font-bold">
                {Math.round((data.conceptosHuerfanos.length / data.totalConceptos) * 100)}%
              </div>
              <div className="text-xs opacity-75 mt-1">sin relaciones</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
