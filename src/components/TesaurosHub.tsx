import { useState } from "react";

export type TesaurosView = "validar" | "editor" | "descargar";

interface TesaurosHubProps {
  onSelectView: (view: TesaurosView) => void;
  onBack: () => void;
}

export default function TesaurosHub({ onSelectView, onBack }: TesaurosHubProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const views = [
    {
      id: "validar" as TesaurosView,
      icon: "📋",
      title: "Validar Conceptos en CCT",
      description: "Revisa y valida conceptos detectados en documentos terminados",
      longDescription: "Accede a los documentos completados y valida los conceptos detectados automáticamente. Puedes aprobar, corregir o eliminar conceptos, agregando notas de validación.",
      color: "#2196f3"
    },
    {
      id: "editor" as TesaurosView,
      icon: "📚",
      title: "Editor de Tesauro",
      description: "Agrega, edita y gestiona conceptos del diccionario",
      longDescription: "Gestiona el diccionario de conceptos de forma independiente. Agrega nuevos términos, edita definiciones, establece relaciones y gestiona sinónimos sin necesidad de trabajar con documentos CCT.",
      color: "#4caf50"
    },
    {
      id: "descargar" as TesaurosView,
      icon: "💾",
      title: "Descargar Tesauro Completo",
      description: "Exporta el tesauro completo en formato JSON",
      longDescription: "Descarga el tesauro completo actualizado en formato JSON, incluyendo todos los conceptos originales más los que hayas agregado o modificado.",
      color: "#ff9800"
    }
  ];

  return (
    <div style={{
      maxWidth: "1400px",
      margin: "0 auto",
      padding: "40px 20px",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"
    }}>
      {/* Header con botón de volver */}
      <div style={{ marginBottom: "40px" }}>
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
            marginBottom: "20px",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#5e35b1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#673ab7";
          }}
        >
          ← Volver al Menú Principal
        </button>

        <h1 style={{
          fontSize: "42px",
          marginBottom: "15px",
          color: "#673ab7",
          fontWeight: "bold",
          textShadow: "2px 2px 4px rgba(0,0,0,0.1)"
        }}>
          🔍 Gestión de Tesauros y Ontología
        </h1>
        <p style={{
          fontSize: "18px",
          color: "#455a64",
          maxWidth: "800px"
        }}>
          Herramientas especializadas para la gestión, validación y mantenimiento del diccionario de conceptos
        </p>
      </div>

      {/* Panel informativo */}
      <div style={{
        background: "linear-gradient(135deg, #673ab7 0%, #512da8 100%)",
        borderRadius: "12px",
        padding: "30px",
        marginBottom: "40px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        color: "white"
      }}>
        <h2 style={{
          fontSize: "24px",
          marginBottom: "15px",
          fontWeight: "bold"
        }}>
          Acerca de esta Sección
        </h2>
        <p style={{
          fontSize: "16px",
          lineHeight: "1.8",
          marginBottom: "20px"
        }}>
          Esta área está diseñada específicamente para la gestión de la ontología y el tesauro de conceptos.
          Aquí puedes validar conceptos en documentos terminados, editar el diccionario de términos y
          descargar el tesauro completo para respaldo.
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
          fontSize: "14px"
        }}>
          <div style={{
            padding: "12px",
            background: "rgba(255,255,255,0.15)",
            borderRadius: "8px"
          }}>
            <strong>Conceptos en Tesauro:</strong> 4608
          </div>
          <div style={{
            padding: "12px",
            background: "rgba(255,255,255,0.15)",
            borderRadius: "8px"
          }}>
            <strong>Versión:</strong> v4.249
          </div>
          <div style={{
            padding: "12px",
            background: "rgba(255,255,255,0.15)",
            borderRadius: "8px"
          }}>
            <strong>Última actualización:</strong> 2025-10-16
          </div>
        </div>
      </div>

      {/* Cards de opciones */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
        gap: "30px",
        marginBottom: "40px"
      }}>
        {views.map((view) => (
          <div
            key={view.id}
            onClick={() => onSelectView(view.id)}
            onMouseEnter={() => setHoveredCard(view.id)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: "white",
              padding: "35px",
              borderRadius: "12px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: hoveredCard === view.id
                ? "0 12px 35px rgba(0,0,0,0.2)"
                : "0 4px 15px rgba(0,0,0,0.1)",
              border: `3px solid ${view.color}`,
              transform: hoveredCard === view.id ? "translateY(-8px)" : "translateY(0)"
            }}
          >
            {/* Icono */}
            <div style={{
              fontSize: "70px",
              marginBottom: "20px",
              textAlign: "center"
            }}>
              {view.icon}
            </div>

            {/* Título */}
            <h3 style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: view.color,
              marginBottom: "15px",
              textAlign: "center"
            }}>
              {view.title}
            </h3>

            {/* Descripción corta */}
            <p style={{
              fontSize: "15px",
              color: "#666",
              lineHeight: "1.6",
              marginBottom: "20px",
              textAlign: "center",
              fontWeight: "500"
            }}>
              {view.description}
            </p>

            {/* Descripción larga */}
            <p style={{
              fontSize: "14px",
              color: "#888",
              lineHeight: "1.6",
              marginBottom: "20px"
            }}>
              {view.longDescription}
            </p>

            {/* Botón de acción */}
            <div style={{
              padding: "15px",
              background: `${view.color}15`,
              borderRadius: "8px",
              fontSize: "16px",
              color: view.color,
              fontWeight: "bold",
              textAlign: "center",
              transition: "all 0.2s"
            }}>
              {hoveredCard === view.id ? `Abrir ${view.title} →` : "Seleccionar"}
            </div>
          </div>
        ))}
      </div>

      {/* Información adicional */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "30px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{
          fontSize: "20px",
          marginBottom: "15px",
          color: "#333",
          fontWeight: "bold"
        }}>
          Flujo de Trabajo Recomendado
        </h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          fontSize: "14px",
          color: "#666",
          lineHeight: "1.8"
        }}>
          <div>
            <div style={{
              fontSize: "24px",
              marginBottom: "10px",
              color: "#2196f3"
            }}>
              1️⃣
            </div>
            <strong style={{ color: "#333" }}>Valida Conceptos:</strong>
            <p>Comienza validando los conceptos detectados automáticamente en los documentos terminados.</p>
          </div>
          <div>
            <div style={{
              fontSize: "24px",
              marginBottom: "10px",
              color: "#4caf50"
            }}>
              2️⃣
            </div>
            <strong style={{ color: "#333" }}>Edita el Tesauro:</strong>
            <p>Agrega nuevos conceptos que hayas identificado o que sean necesarios para futuros documentos.</p>
          </div>
          <div>
            <div style={{
              fontSize: "24px",
              marginBottom: "10px",
              color: "#ff9800"
            }}>
              3️⃣
            </div>
            <strong style={{ color: "#333" }}>Descarga Respaldo:</strong>
            <p>Periódicamente descarga el tesauro completo como respaldo local de tu trabajo.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
