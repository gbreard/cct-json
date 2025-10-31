import { useEffect, useRef, useState } from "react";

/**
 * Visualización de grafo para relaciones de tesauro
 * Implementa una visualización simple con SVG (sin dependencias externas)
 * Usa algoritmo de fuerzas básico para el layout
 */

interface Concepto {
  id: string;
  termino_preferido: string;
  relaciones: {
    terminos_especificos: string[];
    terminos_generales: string[];
    es_parte_de: string[];
    tiene_partes: string[];
    requiere: string[];
    regulado_por: string[];
    terminos_relacionados: string[];
    [key: string]: string[];
  };
}

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fixed: boolean;
}

interface Edge {
  source: string;
  target: string;
  type: string;
  label: string;
}

interface TesauroGraphViewProps {
  conceptos: Concepto[];
  conceptoRaiz?: string;
  onNodeClick?: (conceptoId: string) => void;
  maxDepth?: number;
}

const RELATION_COLORS: Record<string, string> = {
  terminos_especificos: "#2196f3",
  terminos_generales: "#4caf50",
  es_parte_de: "#ff9800",
  tiene_partes: "#f44336",
  requiere: "#9c27b0",
  regulado_por: "#795548",
  terminos_relacionados: "#607d8b",
};

const RELATION_LABELS: Record<string, string> = {
  terminos_especificos: "específico",
  terminos_generales: "general",
  es_parte_de: "parte de",
  tiene_partes: "tiene",
  requiere: "requiere",
  regulado_por: "regulado por",
  terminos_relacionados: "relacionado",
};

export default function TesauroGraphView({
  conceptos,
  conceptoRaiz,
  onNodeClick,
  maxDepth = 2,
}: TesauroGraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(conceptoRaiz || null);
  const [dragging, setDragging] = useState<string | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const width = 1200;
  const height = 800;

  // Construir grafo a partir del concepto raíz
  useEffect(() => {
    if (!conceptoRaiz || conceptos.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const raiz = conceptos.find((c) => c.id === conceptoRaiz);
    if (!raiz) return;

    const visitados = new Set<string>();
    const nodosMap = new Map<string, Node>();
    const aristas: Edge[] = [];

    const addNode = (concepto: Concepto, depth: number) => {
      if (visitados.has(concepto.id) || depth > maxDepth) return;
      visitados.add(concepto.id);

      // Agregar nodo con posición inicial aleatoria
      nodosMap.set(concepto.id, {
        id: concepto.id,
        label: concepto.termino_preferido,
        x: width / 2 + (Math.random() - 0.5) * 200,
        y: height / 2 + (Math.random() - 0.5) * 200,
        vx: 0,
        vy: 0,
        fixed: depth === 0, // El nodo raíz es fijo
      });

      // Agregar aristas y nodos relacionados
      Object.entries(concepto.relaciones).forEach(([tipo, ids]) => {
        ids.forEach((relacionId) => {
          const relacionConcepto = conceptos.find((c) => c.id === relacionId);
          if (!relacionConcepto) return;

          aristas.push({
            source: concepto.id,
            target: relacionId,
            type: tipo,
            label: RELATION_LABELS[tipo] || tipo,
          });

          if (!visitados.has(relacionId)) {
            addNode(relacionConcepto, depth + 1);
          }
        });
      });
    };

    addNode(raiz, 0);

    setNodes(Array.from(nodosMap.values()));
    setEdges(aristas);
  }, [conceptoRaiz, conceptos, maxDepth, width, height]);

  // Simulación de fuerzas (simple)
  useEffect(() => {
    if (nodes.length === 0) return;

    const simulate = () => {
      setNodes((prevNodes) => {
        const newNodes = [...prevNodes];

        // Fuerzas de repulsión entre nodos
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const dx = newNodes[j].x - newNodes[i].x;
            const dy = newNodes[j].y - newNodes[i].y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;

            if (distance < 150) {
              const force = (150 - distance) / distance;
              const fx = (dx / distance) * force * 0.5;
              const fy = (dy / distance) * force * 0.5;

              if (!newNodes[i].fixed) {
                newNodes[i].vx -= fx;
                newNodes[i].vy -= fy;
              }

              if (!newNodes[j].fixed) {
                newNodes[j].vx += fx;
                newNodes[j].vy += fy;
              }
            }
          }
        }

        // Fuerzas de atracción por aristas
        edges.forEach((edge) => {
          const sourceNode = newNodes.find((n) => n.id === edge.source);
          const targetNode = newNodes.find((n) => n.id === edge.target);

          if (!sourceNode || !targetNode) return;

          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          const idealDistance = 120;
          const force = (distance - idealDistance) / distance;
          const fx = (dx / distance) * force * 0.1;
          const fy = (dy / distance) * force * 0.1;

          if (!sourceNode.fixed) {
            sourceNode.vx += fx;
            sourceNode.vy += fy;
          }

          if (!targetNode.fixed) {
            targetNode.vx -= fx;
            targetNode.vy -= fy;
          }
        });

        // Actualizar posiciones
        newNodes.forEach((node) => {
          if (!node.fixed && node.id !== dragging) {
            node.vx *= 0.8; // Damping
            node.vy *= 0.8;

            node.x += node.vx;
            node.y += node.vy;

            // Mantener dentro del canvas
            node.x = Math.max(50, Math.min(width - 50, node.x));
            node.y = Math.max(50, Math.min(height - 50, node.y));
          }
        });

        return newNodes;
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes.length, edges, dragging, width, height]);

  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDragging(nodeId);
    setSelectedNode(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === dragging
          ? { ...node, x, y, vx: 0, vy: 0 }
          : node
      )
    );
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
    if (onNodeClick) {
      onNodeClick(nodeId);
    }
  };

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Selecciona un concepto para ver su grafo de relaciones
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-50 overflow-hidden">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="border border-gray-200"
      >
        {/* Definir markers para flechas */}
        <defs>
          {Object.entries(RELATION_COLORS).map(([type, color]) => (
            <marker
              key={type}
              id={`arrow-${type}`}
              markerWidth="10"
              markerHeight="10"
              refX="25"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill={color} />
            </marker>
          ))}
        </defs>

        {/* Dibujar aristas */}
        <g>
          {edges.map((edge, idx) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);

            if (!sourceNode || !targetNode) return null;

            const color = RELATION_COLORS[edge.type] || "#999";

            return (
              <g key={idx}>
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={color}
                  strokeWidth="2"
                  markerEnd={`url(#arrow-${edge.type})`}
                  opacity="0.6"
                />
                <text
                  x={(sourceNode.x + targetNode.x) / 2}
                  y={(sourceNode.y + targetNode.y) / 2}
                  fill={color}
                  fontSize="10"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* Dibujar nodos */}
        <g>
          {nodes.map((node) => {
            const isSelected = node.id === selectedNode;
            const isRoot = node.fixed;

            return (
              <g
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                onClick={() => handleNodeClick(node.id)}
                className="cursor-pointer"
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isRoot ? 35 : isSelected ? 30 : 25}
                  fill={isRoot ? "#9c27b0" : isSelected ? "#2196f3" : "#4caf50"}
                  stroke={isSelected ? "#000" : "#fff"}
                  strokeWidth={isSelected ? "3" : "2"}
                  opacity="0.9"
                />
                <text
                  x={node.x}
                  y={node.y}
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none select-none"
                >
                  {node.label.length > 15
                    ? node.label.substring(0, 12) + "..."
                    : node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg">
        <div className="text-sm font-bold mb-2">Tipos de Relaciones:</div>
        <div className="space-y-1">
          {Object.entries(RELATION_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-4 h-1"
                style={{ backgroundColor: RELATION_COLORS[type] }}
              />
              <span className="text-xs">{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-600">
          💡 Arrastra los nodos para reorganizar
        </div>
      </div>
    </div>
  );
}
