import { useState, useEffect } from "react";

export interface CCTCategory {
  id: string;
  nombre: string;
  descripcion: string;
  patron: string; // Patrón para buscar en nombres de archivo
  color: string; // Color del card
}

interface CategorySelectorProps {
  onSelectCategory: (categoryId: string) => void;
  onSelectTesauros?: () => void;
}

export default function CategorySelector({ onSelectCategory, onSelectTesauros }: CategorySelectorProps) {
  const [categories, setCategories] = useState<CCTCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAbout, setShowAbout] = useState(true);

  useEffect(() => {
    // Configuración de categorías de CCT (solo para Abogada 1)
    const availableCategories: CCTCategory[] = [
      {
        id: "130-75",
        nombre: "CCT 130/75",
        descripcion: "Empleados de Comercio - Convenio Colectivo de Trabajo Principal",
        patron: "130",
        color: "#2196f3"
      },
      {
        id: "75",
        nombre: "CCT 75",
        descripcion: "Convenios Colectivos 75 (próximamente)",
        patron: "^75-",
        color: "#4caf50"
      },
      {
        id: "100",
        nombre: "CCT 100",
        descripcion: "Convenios Colectivos 100 (próximamente)",
        patron: "^100-",
        color: "#ff9800"
      }
    ];

    setCategories(availableCategories);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "18px",
        color: "#666"
      }}>
        Cargando categorías...
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: "1400px",
      margin: "0 auto",
      padding: "40px 20px",
      height: "100vh",
      overflow: "auto",
      boxSizing: "border-box",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"
    }}>
      {/* Header */}
      <div style={{ marginBottom: "40px", textAlign: "center" }}>
        <h1 style={{
          fontSize: "42px",
          marginBottom: "15px",
          color: "#1a237e",
          fontWeight: "bold",
          textShadow: "2px 2px 4px rgba(0,0,0,0.1)"
        }}>
          Editor de Convenios Colectivos de Trabajo
        </h1>
        <p style={{
          fontSize: "18px",
          color: "#455a64",
          maxWidth: "800px",
          margin: "0 auto"
        }}>
          Sistema moderno de edición y gestión de CCT con sincronización en la nube
        </p>
      </div>

      {/* Panel "Acerca de esta aplicación" */}
      {showAbout && (
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "12px",
          padding: "30px",
          marginBottom: "40px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          color: "white",
          position: "relative"
        }}>
          <button
            onClick={() => setShowAbout(false)}
            style={{
              position: "absolute",
              top: "15px",
              right: "15px",
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              cursor: "pointer",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Ocultar información"
          >
            ×
          </button>

          <h2 style={{
            fontSize: "28px",
            marginBottom: "20px",
            fontWeight: "bold"
          }}>
            Acerca de esta Aplicación
          </h2>

          <div style={{
            fontSize: "16px",
            lineHeight: "1.8",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "25px"
          }}>
            <div>
              <h3 style={{ fontSize: "20px", marginBottom: "10px", fontWeight: "bold" }}>
                ¿Qué es?
              </h3>
              <p>
                Editor web especializado para revisar y editar <strong>Convenios Colectivos de Trabajo (CCT)</strong>,
                diseñado para abogados laboralistas y profesionales de RRHH que necesitan gestionar documentos legales complejos.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: "20px", marginBottom: "10px", fontWeight: "bold" }}>
                Características Principales
              </h3>
              <ul style={{ paddingLeft: "20px", margin: "10px 0" }}>
                <li>Interfaz de 3 paneles: navegación, edición y PDF</li>
                <li>Autoguardado dual: local (30s) + nube</li>
                <li>Sincronización multi-PC en tiempo real</li>
                <li>Búsqueda automática en PDF integrado</li>
                <li>Validación JSON Schema en tiempo real</li>
                <li>Seguimiento de progreso por documento</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: "20px", marginBottom: "10px", fontWeight: "bold" }}>
                Estructura del Documento
              </h3>
              <ul style={{ paddingLeft: "20px", margin: "10px 0" }}>
                <li><strong>Preámbulo:</strong> Introducción del convenio</li>
                <li><strong>Capítulos:</strong> Secciones principales (números romanos)</li>
                <li><strong>Artículos:</strong> Contenido con incisos detectados</li>
                <li><strong>Cláusulas:</strong> Cláusulas independientes</li>
                <li><strong>Anexos:</strong> Tablas salariales y material suplementario</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: "20px", marginBottom: "10px", fontWeight: "bold" }}>
                Sistema de Revisión
              </h3>
              <p>
                Cada elemento puede marcarse como <strong>OK</strong>, <strong>Duda</strong> o <strong>Corregir</strong>.
                El sistema calcula automáticamente el progreso y permite filtrar por estado.
                Los documentos terminados se marcan con un badge verde.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: "20px", marginBottom: "10px", fontWeight: "bold" }}>
                Tecnología
              </h3>
              <p>
                React 19 + TypeScript + Vite | Zustand | Vercel KV (Redis) | React PDF |
                AJV Schema Validator | Drag & Drop
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: "20px", marginBottom: "10px", fontWeight: "bold" }}>
                Usuarios
              </h3>
              <p>
                Abogados laboralistas, departamentos de RRHH, organizaciones sindicales y
                profesionales que gestionan convenios colectivos de trabajo.
              </p>
            </div>
          </div>

          <div style={{
            marginTop: "25px",
            padding: "20px",
            background: "rgba(255,255,255,0.15)",
            borderRadius: "8px",
            fontSize: "14px"
          }}>
            <strong>Ventaja Clave:</strong> Sistema híbrido de autoguardado que combina respaldo local instantáneo
            con sincronización en la nube, permitiendo colaboración multi-usuario sin perder cambios.
          </div>
        </div>
      )}

      {!showAbout && (
        <button
          onClick={() => setShowAbout(true)}
          style={{
            marginBottom: "20px",
            padding: "10px 20px",
            background: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold"
          }}
        >
          ℹ️ Mostrar información de la aplicación
        </button>
      )}

      {/* Categorías de CCT */}
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{
          fontSize: "28px",
          marginBottom: "20px",
          color: "#333",
          fontWeight: "bold"
        }}>
          Seleccionar Categoría de CCT
        </h2>
        <p style={{
          fontSize: "16px",
          color: "#666",
          marginBottom: "20px"
        }}>
          Elige una categoría para ver los documentos disponibles
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        gap: "25px",
        marginBottom: "40px"
      }}>
        {categories.map((category) => {
          const isAvailable = category.id === "130-75";
          const isComingSoon = !isAvailable;

          return (
            <div
              key={category.id}
              onClick={() => isAvailable && onSelectCategory(category.id)}
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "12px",
                cursor: isAvailable ? "pointer" : "not-allowed",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                border: `3px solid ${isAvailable ? category.color : "#ccc"}`,
                opacity: isAvailable ? 1 : 0.6,
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={(e) => {
                if (isAvailable) {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
                }
              }}
              onMouseLeave={(e) => {
                if (isAvailable) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)";
                }
              }}
            >
              {/* Badge de estado */}
              {isComingSoon && (
                <div style={{
                  position: "absolute",
                  top: "15px",
                  right: "15px",
                  background: "#ff9800",
                  color: "white",
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "bold"
                }}>
                  Próximamente
                </div>
              )}

              {/* Icono de carpeta */}
              <div style={{
                fontSize: "60px",
                marginBottom: "20px",
                color: category.color
              }}>
                {category.id === "validacion-conceptos" ? "🔍" : "📁"}
              </div>

              {/* Nombre de la categoría */}
              <h3 style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: category.color,
                marginBottom: "15px"
              }}>
                {category.nombre}
              </h3>

              {/* Descripción */}
              <p style={{
                fontSize: "15px",
                color: "#666",
                lineHeight: "1.6",
                marginBottom: "20px"
              }}>
                {category.descripcion}
              </p>

              {/* Indicador de documentos */}
              {isAvailable && (
                <div style={{
                  padding: "12px",
                  background: `${category.color}15`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: category.color,
                  fontWeight: "bold",
                  textAlign: "center"
                }}>
                  18 documentos disponibles
                </div>
              )}

              {/* Botón de acción */}
              {isAvailable && (
                <div style={{
                  marginTop: "20px",
                  fontSize: "16px",
                  color: category.color,
                  fontWeight: "bold",
                  textAlign: "right"
                }}>
                  Abrir →
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SECCIÓN 2: Gestión de Tesauros y Ontología (Abogada 2) */}
      <div style={{ marginTop: "60px", marginBottom: "30px" }}>
        <h2 style={{
          fontSize: "28px",
          marginBottom: "10px",
          color: "#333",
          fontWeight: "bold"
        }}>
          🔍 Gestión de Tesauros y Ontología
        </h2>
        <p style={{
          fontSize: "16px",
          color: "#666",
          marginBottom: "20px"
        }}>
          Herramientas especializadas para revisión y gestión de conceptos del tesauro
        </p>
      </div>

      {/* Card única para acceder a Gestión de Tesauros */}
      <div
        onClick={() => onSelectTesauros && onSelectTesauros()}
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "12px",
          cursor: "pointer",
          transition: "all 0.3s ease",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          border: "3px solid #673ab7",
          marginBottom: "40px"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-5px)";
          e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)";
        }}
      >
        {/* Icono grande */}
        <div style={{
          fontSize: "80px",
          marginBottom: "20px",
          color: "#673ab7",
          textAlign: "center"
        }}>
          🔍
        </div>

        {/* Título */}
        <h3 style={{
          fontSize: "28px",
          fontWeight: "bold",
          color: "#673ab7",
          marginBottom: "20px",
          textAlign: "center"
        }}>
          Gestión de Tesauros y Ontología
        </h3>

        {/* Descripción */}
        <p style={{
          fontSize: "16px",
          color: "#666",
          lineHeight: "1.6",
          marginBottom: "30px",
          textAlign: "center"
        }}>
          Espacio especializado para la validación de conceptos en documentos terminados,
          edición del diccionario de tesauros y gestión de la ontología completa
        </p>

        {/* Lista de funcionalidades */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginBottom: "20px"
        }}>
          <div style={{
            padding: "20px",
            background: "#f3e5f5",
            borderRadius: "8px",
            border: "2px solid #673ab7"
          }}>
            <div style={{ fontSize: "32px", marginBottom: "10px" }}>📋</div>
            <div style={{ fontWeight: "bold", color: "#673ab7", marginBottom: "8px" }}>
              Validar Conceptos en CCT
            </div>
            <div style={{ fontSize: "13px", color: "#666" }}>
              Revisa y valida conceptos detectados en documentos terminados
            </div>
          </div>

          <div style={{
            padding: "20px",
            background: "#f3e5f5",
            borderRadius: "8px",
            border: "2px solid #673ab7"
          }}>
            <div style={{ fontSize: "32px", marginBottom: "10px" }}>📚</div>
            <div style={{ fontWeight: "bold", color: "#673ab7", marginBottom: "8px" }}>
              Editor de Tesauro
            </div>
            <div style={{ fontSize: "13px", color: "#666" }}>
              Agrega, edita y gestiona conceptos del diccionario
            </div>
          </div>

          <div style={{
            padding: "20px",
            background: "#f3e5f5",
            borderRadius: "8px",
            border: "2px solid #673ab7"
          }}>
            <div style={{ fontSize: "32px", marginBottom: "10px" }}>💾</div>
            <div style={{ fontWeight: "bold", color: "#673ab7", marginBottom: "8px" }}>
              Descargar Tesauro
            </div>
            <div style={{ fontSize: "13px", color: "#666" }}>
              Exporta el tesauro completo en formato JSON
            </div>
          </div>
        </div>

        {/* Botón de acción */}
        <div style={{
          marginTop: "20px",
          fontSize: "18px",
          color: "#673ab7",
          fontWeight: "bold",
          textAlign: "center"
        }}>
          Ingresar a Gestión de Tesauros →
        </div>
      </div>

      {/* Footer con información */}
      <div style={{
        marginTop: "40px",
        padding: "25px",
        backgroundColor: "rgba(255,255,255,0.9)",
        borderRadius: "12px",
        fontSize: "14px",
        color: "#666",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px"
        }}>
          <div>
            <strong style={{ color: "#333", fontSize: "16px" }}>Total de Categorías:</strong>
            <p style={{ margin: "5px 0 0 0" }}>{categories.length} categorías configuradas</p>
          </div>
          <div>
            <strong style={{ color: "#333", fontSize: "16px" }}>Disponibles:</strong>
            <p style={{ margin: "5px 0 0 0" }}>{categories.filter(c => c.id === "130-75").length} categorías activas</p>
          </div>
          <div>
            <strong style={{ color: "#333", fontSize: "16px" }}>Estado:</strong>
            <p style={{ margin: "5px 0 0 0" }}>Sistema operativo con sincronización en la nube activa</p>
          </div>
        </div>
      </div>
    </div>
  );
}
