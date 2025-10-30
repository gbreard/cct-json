import { useDocStore } from "../state/useDocStore";
import MultiTableEditor from "./MultiTableEditor";
import type { TablaEditableExtendida } from "../lib/types";

export default function EditorForm() {
  const { doc, selected, updatePreambulo, updateCapitulo, updateArticulo, updateClausula, deleteCapitulo, deleteArticulo, deleteClausula, updateSeccionPersonalizada, deleteSeccionPersonalizada, updateAnexo, deleteAnexo } = useDocStore();

  if (!doc || !selected) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
        <p style={{ fontSize: "16px" }}>Selecciona un elemento del árbol para editarlo</p>
        <p style={{ fontSize: "14px", marginTop: "10px", color: "#999" }}>
          Puedes editar: capítulos, artículos, cláusulas, preámbulo, anexos y elementos personalizados
        </p>
      </div>
    );
  }

  // Editar Preámbulo
  if (selected.type === "preambulo") {
    return (
      <div style={{ padding: "20px", height: "100%", overflow: "auto" }}>
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ margin: 0, marginBottom: "10px" }}>Editar Preámbulo</h3>
          <div style={{ fontSize: "13px", color: "#666" }}>
            Texto introductorio del documento
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Contenido del Preámbulo:
          </label>
          <textarea
            value={doc.estructura.preambulo || ""}
            onChange={(e) => updatePreambulo(e.target.value)}
            style={{
              width: "100%",
              minHeight: "400px",
              padding: "12px",
              fontSize: "14px",
              fontFamily: "monospace",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box",
              resize: "vertical"
            }}
          />
          <div style={{ fontSize: "12px", color: "#999", marginTop: "5px" }}>
            {doc.estructura.preambulo?.length || 0} caracteres
          </div>
        </div>
      </div>
    );
  }

  // Editar Capítulo
  if (selected.type === "capitulo" && selected.capIndex !== undefined && selected.artIndex === undefined) {
    const capitulo = doc.estructura.capitulos?.[selected.capIndex];
    if (!capitulo) return null;

    return (
      <div style={{ padding: "20px", height: "100%", overflow: "auto" }}>
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0 }}>Editar Capítulo {capitulo.numero_romano || capitulo.numero}</h3>
            <div style={{ fontSize: "13px", color: "#666", marginTop: "5px" }}>
              {capitulo.articulos?.length || 0} artículos en este capítulo
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm(`¿Eliminar el capítulo ${capitulo.numero_romano || capitulo.numero} y todos sus artículos?`)) {
                deleteCapitulo(selected.capIndex!);
              }
            }}
            style={{
              padding: "8px 16px",
              background: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px"
            }}
          >
            🗑️ Eliminar Capítulo
          </button>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Número del Capítulo:
          </label>
          <input
            type="number"
            value={capitulo.numero}
            onChange={(e) => updateCapitulo(selected.capIndex!, { numero: parseInt(e.target.value) })}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Número Romano (opcional):
          </label>
          <input
            type="text"
            value={capitulo.numero_romano || ""}
            onChange={(e) => updateCapitulo(selected.capIndex!, { numero_romano: e.target.value })}
            placeholder="I, II, III, etc."
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Título:
          </label>
          <input
            type="text"
            value={capitulo.titulo}
            onChange={(e) => updateCapitulo(selected.capIndex!, { titulo: e.target.value })}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ padding: "15px", background: "#f5f5f5", borderRadius: "5px", marginTop: "30px" }}>
          <strong style={{ fontSize: "14px" }}>📊 Resumen:</strong>
          <div style={{ fontSize: "13px", marginTop: "8px", color: "#666" }}>
            • Artículos: {capitulo.articulos?.length || 0}
          </div>
        </div>
      </div>
    );
  }

  // Editar Artículo
  if (selected.type === "articulo" && selected.capIndex !== undefined && selected.artIndex !== undefined) {
    const articulo = doc.estructura.capitulos?.[selected.capIndex]?.articulos[selected.artIndex];
    if (!articulo) return null;

    return (
      <div style={{ padding: "20px", height: "100%", overflow: "auto" }}>
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0 }}>Editar Artículo {articulo.numero}</h3>
            {articulo.titulo && (
              <div style={{ fontSize: "13px", color: "#666", marginTop: "5px" }}>
                {articulo.titulo}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (window.confirm(`¿Eliminar el artículo ${articulo.numero}?`)) {
                deleteArticulo(selected.capIndex!, selected.artIndex!);
              }
            }}
            style={{
              padding: "8px 16px",
              background: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px"
            }}
          >
            🗑️ Eliminar Artículo
          </button>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Número del Artículo:
          </label>
          <input
            type="number"
            value={articulo.numero}
            onChange={(e) => updateArticulo(selected.capIndex!, selected.artIndex!, { numero: parseInt(e.target.value) })}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Título (opcional):
          </label>
          <input
            type="text"
            value={articulo.titulo || ""}
            onChange={(e) => updateArticulo(selected.capIndex!, selected.artIndex!, { titulo: e.target.value })}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Contenido:
          </label>
          <textarea
            value={articulo.contenido || ""}
            onChange={(e) => updateArticulo(selected.capIndex!, selected.artIndex!, { contenido: e.target.value })}
            style={{
              width: "100%",
              minHeight: "250px",
              padding: "12px",
              fontSize: "14px",
              fontFamily: "monospace",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box",
              resize: "vertical"
            }}
          />
          <div style={{ fontSize: "12px", color: "#999", marginTop: "5px" }}>
            {articulo.contenido?.length || 0} caracteres
          </div>
        </div>

        {/* Checkbox para tablas */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px" }}>
            <input
              type="checkbox"
              checked={articulo.contiene_tabla || false}
              onChange={(e) => {
                const checked = e.target.checked;
                const tablas: TablaEditableExtendida[] = checked ? [{
                  id: `tabla_${Date.now()}`,
                  titulo: "",
                  headers: ["Columna 1", "Columna 2"],
                  rows: [["", ""]],
                  nota_al_pie: ""
                }] : [];
                updateArticulo(selected.capIndex!, selected.artIndex!, {
                  contiene_tabla: checked,
                  tablas_editables: checked ? tablas : undefined,
                  tabla_editable: undefined // Limpiar formato antiguo
                });
              }}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <strong>Este artículo contiene tabla(s)</strong>
          </label>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "5px", marginLeft: "26px" }}>
            Marcá esto si el artículo incluye una o más tablas (escalas salariales, categorías, etc.)
          </div>
        </div>

        {/* Editor de múltiples tablas si está marcado */}
        {articulo.contiene_tabla && (
          <div style={{ marginBottom: "20px" }}>
            <MultiTableEditor
              value={articulo.tabla_editable}
              values={articulo.tablas_editables}
              onChange={(tablas: TablaEditableExtendida[]) => {
                updateArticulo(selected.capIndex!, selected.artIndex!, {
                  tablas_editables: tablas,
                  tabla_editable: undefined, // Limpiar formato antiguo
                  contiene_tabla: tablas.length > 0
                });
              }}
            />
          </div>
        )}

        {/* Status selector */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Estado de Revisión:
          </label>
          <select
            value={articulo.status || ""}
            onChange={(e) => updateArticulo(selected.capIndex!, selected.artIndex!, { status: e.target.value as any })}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          >
            <option value="">Sin revisar</option>
            <option value="OK">✅ OK</option>
            <option value="Corregir">⚠️ Corregir</option>
            <option value="Duda">❓ Duda</option>
          </select>
        </div>

        {/* Conceptos detectados */}
        {articulo.conceptos_detectados && articulo.conceptos_detectados.length > 0 && (
          <div style={{ padding: "15px", background: "#e8f5e9", borderRadius: "5px", marginTop: "20px" }}>
            <strong style={{ fontSize: "14px" }}>🏷️ Conceptos Detectados ({articulo.conceptos_detectados.length}):</strong>
            <div style={{ marginTop: "10px", maxHeight: "200px", overflow: "auto" }}>
              {articulo.conceptos_detectados.slice(0, 10).map((concepto, i) => (
                <div key={i} style={{ padding: "8px", background: "white", marginBottom: "5px", borderRadius: "3px", fontSize: "13px" }}>
                  <strong>{concepto.termino}</strong>
                  <span style={{ marginLeft: "10px", color: "#666" }}>
                    ID: {concepto.id} | Frecuencia: {concepto.frecuencia} | Confianza: {(concepto.confianza * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
              {articulo.conceptos_detectados.length > 10 && (
                <div style={{ padding: "8px", textAlign: "center", color: "#666", fontSize: "12px" }}>
                  ... y {articulo.conceptos_detectados.length - 10} conceptos más
                </div>
              )}
            </div>
          </div>
        )}

        {/* Incisos detectados */}
        {articulo.incisos_detectados && articulo.incisos_detectados.length > 0 && (
          <div style={{ padding: "15px", background: "#fff3e0", borderRadius: "5px", marginTop: "20px" }}>
            <strong style={{ fontSize: "14px" }}>📋 Incisos Detectados ({articulo.incisos_detectados.length}):</strong>
            <div style={{ marginTop: "10px", maxHeight: "200px", overflow: "auto" }}>
              {articulo.incisos_detectados.map((inciso, i) => {
                // Manejar incisos que son strings o objetos
                const isString = typeof inciso === 'string';
                const identificador = isString ? `Inciso ${i + 1}` : (inciso.identificador || `Inciso ${i + 1}`);
                const texto = isString ? inciso : (inciso.texto || inciso.contenido || "");

                return (
                  <div key={i} style={{ padding: "8px", background: "white", marginBottom: "5px", borderRadius: "3px", fontSize: "13px" }}>
                    <strong>{identificador}</strong>
                    <div style={{ marginTop: "4px", color: "#666" }}>
                      {texto && typeof texto === 'string' ? (
                        <>{texto.substring(0, 100)}{texto.length > 100 ? "..." : ""}</>
                      ) : (
                        "(Sin contenido)"
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ padding: "15px", background: "#f5f5f5", borderRadius: "5px", marginTop: "20px" }}>
          <strong style={{ fontSize: "14px" }}>📊 Metadatos:</strong>
          <div style={{ fontSize: "13px", marginTop: "8px", color: "#666" }}>
            • Longitud: {articulo.longitud_caracteres || articulo.contenido.length} caracteres
            {articulo.longitud_lineas && <span> / {articulo.longitud_lineas} líneas</span>}
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>
            • Incisos: {articulo.num_incisos || 0}
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>
            • Conceptos: {articulo.conceptos_detectados?.length || 0}
          </div>
        </div>
      </div>
    );
  }

  // Editar Cláusula
  if (selected.type === "clausula" && selected.clausIndex !== undefined) {
    const clausula = doc.estructura.clausulas?.[selected.clausIndex];
    if (!clausula) return null;

    return (
      <div style={{ padding: "20px", height: "100%", overflow: "auto" }}>
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0 }}>Editar Cláusula {clausula.numero}</h3>
            {clausula.ordinal && (
              <div style={{ fontSize: "13px", color: "#666", marginTop: "5px" }}>
                {clausula.ordinal}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (window.confirm(`¿Eliminar la cláusula ${clausula.numero}?`)) {
                deleteClausula(selected.clausIndex!);
              }
            }}
            style={{
              padding: "8px 16px",
              background: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px"
            }}
          >
            🗑️ Eliminar Cláusula
          </button>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Número de Cláusula:
          </label>
          <input
            type="number"
            value={clausula.numero}
            onChange={(e) => updateClausula(selected.clausIndex!, { numero: parseInt(e.target.value) })}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Título:
          </label>
          <input
            type="text"
            value={clausula.titulo}
            onChange={(e) => updateClausula(selected.clausIndex!, { titulo: e.target.value })}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Ordinal (opcional):
          </label>
          <input
            type="text"
            value={clausula.ordinal || ""}
            onChange={(e) => updateClausula(selected.clausIndex!, { ordinal: e.target.value })}
            placeholder="Único, Primera, Segunda, etc."
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Contenido:
          </label>
          <textarea
            value={clausula.contenido || ""}
            onChange={(e) => updateClausula(selected.clausIndex!, {
              contenido: e.target.value,
              longitud_caracteres: e.target.value.length,
              longitud_lineas: e.target.value.split('\n').length
            })}
            style={{
              width: "100%",
              minHeight: "300px",
              padding: "12px",
              fontSize: "14px",
              fontFamily: "monospace",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box",
              resize: "vertical"
            }}
          />
          <div style={{ fontSize: "12px", color: "#999", marginTop: "5px" }}>
            {clausula.contenido?.length || 0} caracteres / {clausula.contenido?.split('\n').length || 0} líneas
          </div>
        </div>

        {/* Checkbox para tablas */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px" }}>
            <input
              type="checkbox"
              checked={clausula.contiene_tabla || false}
              onChange={(e) => {
                const checked = e.target.checked;
                const tablas: TablaEditableExtendida[] = checked ? [{
                  id: `tabla_${Date.now()}`,
                  titulo: "",
                  headers: ["Columna 1", "Columna 2"],
                  rows: [["", ""]],
                  nota_al_pie: ""
                }] : [];
                updateClausula(selected.clausIndex!, {
                  contiene_tabla: checked,
                  tablas_editables: checked ? tablas : undefined,
                  tabla_editable: undefined // Limpiar formato antiguo
                });
              }}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <strong>Esta cláusula contiene tabla(s)</strong>
          </label>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "5px", marginLeft: "26px" }}>
            Marcá esto si la cláusula incluye una o más tablas
          </div>
        </div>

        {/* Editor de múltiples tablas si está marcado */}
        {clausula.contiene_tabla && (
          <div style={{ marginBottom: "20px" }}>
            <MultiTableEditor
              value={clausula.tabla_editable}
              values={clausula.tablas_editables}
              onChange={(tablas: TablaEditableExtendida[]) => {
                updateClausula(selected.clausIndex!, {
                  tablas_editables: tablas,
                  tabla_editable: undefined, // Limpiar formato antiguo
                  contiene_tabla: tablas.length > 0
                });
              }}
            />
          </div>
        )}

        {/* Conceptos detectados */}
        {clausula.conceptos_detectados && clausula.conceptos_detectados.length > 0 && (
          <div style={{ padding: "15px", background: "#e8f5e9", borderRadius: "5px", marginTop: "20px" }}>
            <strong style={{ fontSize: "14px" }}>🏷️ Conceptos Detectados ({clausula.conceptos_detectados.length}):</strong>
            <div style={{ marginTop: "10px", maxHeight: "200px", overflow: "auto" }}>
              {clausula.conceptos_detectados.slice(0, 10).map((concepto, i) => (
                <div key={i} style={{ padding: "8px", background: "white", marginBottom: "5px", borderRadius: "3px", fontSize: "13px" }}>
                  <strong>{concepto.termino}</strong>
                  <span style={{ marginLeft: "10px", color: "#666" }}>
                    ID: {concepto.id} | Frecuencia: {concepto.frecuencia} | Confianza: {(concepto.confianza * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
              {clausula.conceptos_detectados.length > 10 && (
                <div style={{ padding: "8px", textAlign: "center", color: "#666", fontSize: "12px" }}>
                  ... y {clausula.conceptos_detectados.length - 10} conceptos más
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ padding: "15px", background: "#f5f5f5", borderRadius: "5px", marginTop: "20px" }}>
          <strong style={{ fontSize: "14px" }}>📊 Metadatos:</strong>
          <div style={{ fontSize: "13px", marginTop: "8px", color: "#666" }}>
            • Longitud: {clausula.longitud_caracteres} caracteres / {clausula.longitud_lineas} líneas
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>
            • Incisos: {clausula.num_incisos || 0}
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>
            • Conceptos: {clausula.conceptos_detectados?.length || 0}
          </div>
        </div>
      </div>
    );
  }

  // Editar Anexo
  if (selected.type === "anexo" && selected.anexoIndex !== undefined) {
    const anexo = doc.estructura.anexos?.[selected.anexoIndex];
    if (!anexo) return null;

    return (
      <div style={{ padding: "20px", height: "100%", overflow: "auto" }}>
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0 }}>📎 Editar Anexo {anexo.numero}</h3>
            <div style={{ fontSize: "13px", color: "#666", marginTop: "5px" }}>
              {anexo.tipo && `Tipo: ${anexo.tipo}`}
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm(`¿Eliminar el anexo ${anexo.numero}?`)) {
                deleteAnexo(selected.anexoIndex!);
              }
            }}
            style={{
              padding: "8px 16px",
              background: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px"
            }}
          >
            🗑️ Eliminar Anexo
          </button>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Número del Anexo:
          </label>
          <input
            type="number"
            value={anexo.numero}
            onChange={(e) => updateAnexo(selected.anexoIndex!, { numero: parseInt(e.target.value) })}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Título:
          </label>
          <input
            type="text"
            value={anexo.titulo}
            onChange={(e) => updateAnexo(selected.anexoIndex!, { titulo: e.target.value })}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Tipo de Anexo:
          </label>
          <select
            value={anexo.tipo || "OTRO"}
            onChange={(e) => updateAnexo(selected.anexoIndex!, { tipo: e.target.value })}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          >
            <option value="TABLA">TABLA</option>
            <option value="ESCALA_SALARIAL">ESCALA_SALARIAL</option>
            <option value="DOCUMENTO">DOCUMENTO</option>
            <option value="OTRO">OTRO</option>
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Contenido:
          </label>
          <textarea
            value={anexo.contenido || ""}
            onChange={(e) => updateAnexo(selected.anexoIndex!, {
              contenido: e.target.value,
              longitud_caracteres: e.target.value.length
            })}
            style={{
              width: "100%",
              minHeight: "300px",
              padding: "12px",
              fontSize: "14px",
              fontFamily: "monospace",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box",
              resize: "vertical"
            }}
          />
          <div style={{ fontSize: "12px", color: "#999", marginTop: "5px" }}>
            {anexo.contenido?.length || 0} caracteres
          </div>
        </div>

        {/* Checkbox para tablas */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px" }}>
            <input
              type="checkbox"
              checked={anexo.contiene_tabla || false}
              onChange={(e) => {
                const checked = e.target.checked;
                const tablas: TablaEditableExtendida[] = checked ? [{
                  id: `tabla_${Date.now()}`,
                  titulo: "",
                  headers: ["Columna 1", "Columna 2"],
                  rows: [["", ""]],
                  nota_al_pie: ""
                }] : [];
                updateAnexo(selected.anexoIndex!, {
                  contiene_tabla: checked,
                  tablas_editables: checked ? tablas : undefined,
                  tabla_editable: undefined // Limpiar formato antiguo
                });
              }}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <strong>Este anexo contiene tabla(s)</strong>
          </label>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "5px", marginLeft: "26px" }}>
            Marcá esto si el anexo incluye una o más tablas (ideal para escalas salariales, categorías, etc.)
          </div>
        </div>

        {/* Editor de múltiples tablas si está marcado */}
        {anexo.contiene_tabla && (
          <div style={{ marginBottom: "20px" }}>
            <MultiTableEditor
              value={anexo.tabla_editable}
              values={anexo.tablas_editables}
              onChange={(tablas: TablaEditableExtendida[]) => {
                updateAnexo(selected.anexoIndex!, {
                  tablas_editables: tablas,
                  tabla_editable: undefined, // Limpiar formato antiguo
                  contiene_tabla: tablas.length > 0
                });
              }}
            />
          </div>
        )}

        {/* Estado de revisión */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Estado de Revisión:
          </label>
          <select
            value={anexo.status || ""}
            onChange={(e) => updateAnexo(selected.anexoIndex!, { status: e.target.value as any })}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          >
            <option value="">Sin revisar</option>
            <option value="OK">✅ OK</option>
            <option value="Corregir">⚠️ Corregir</option>
            <option value="Duda">❓ Duda</option>
          </select>
        </div>

        {/* Notas de revisión */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Notas de Revisión:
          </label>
          <textarea
            value={anexo.notas_revision || ""}
            onChange={(e) => updateAnexo(selected.anexoIndex!, { notas_revision: e.target.value })}
            placeholder="Notas sobre correcciones necesarias, observaciones, etc."
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "12px",
              fontSize: "14px",
              fontFamily: "monospace",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box",
              resize: "vertical"
            }}
          />
        </div>

        {/* Tablas detectadas */}
        {anexo.tablas_detectadas && anexo.tablas_detectadas.length > 0 && (
          <div style={{ padding: "15px", background: "#e3f2fd", borderRadius: "5px", marginTop: "20px" }}>
            <strong style={{ fontSize: "14px" }}>📊 Tablas Detectadas ({anexo.tablas_detectadas.length}):</strong>
            <div style={{ marginTop: "10px", maxHeight: "200px", overflow: "auto" }}>
              {anexo.tablas_detectadas.map((_, i) => (
                <div key={i} style={{ padding: "8px", background: "white", marginBottom: "5px", borderRadius: "3px", fontSize: "13px" }}>
                  Tabla {i + 1}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: "15px", background: "#f5f5f5", borderRadius: "5px", marginTop: "20px" }}>
          <strong style={{ fontSize: "14px" }}>📊 Metadatos:</strong>
          <div style={{ fontSize: "13px", marginTop: "8px", color: "#666" }}>
            • Longitud: {anexo.longitud_caracteres || anexo.contenido.length} caracteres
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>
            • Tablas: {anexo.tablas_detectadas?.length || 0}
          </div>
        </div>
      </div>
    );
  }

  // Editar Sección Personalizada
  if (selected.type === "seccion_personalizada" && selected.seccionIndex !== undefined) {
    const seccion = doc.estructura.secciones_personalizadas?.[selected.seccionIndex];
    if (!seccion) return null;

    // Tipos comunes sugeridos
    const tiposComunes = [
      "TABLA",
      "ESCALA_SALARIAL",
      "NOTA_ACLARATORIA",
      "DISPOSICION_TRANSITORIA",
      "FIRMANTES",
      "FECHA_VIGENCIA",
      "INTRODUCCION",
      "CONCLUSION",
      "BIBLIOGRAFIA",
      "ANEXO",
      "OTRO"
    ];

    return (
      <div style={{ padding: "20px", height: "100%", overflow: "auto" }}>
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0 }}>✨ Editar Elemento Personalizado</h3>
            <div style={{ fontSize: "13px", color: "#666", marginTop: "5px" }}>
              Tipo: {seccion.tipo_elemento}
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm(`¿Eliminar la sección "${seccion.titulo}"?`)) {
                deleteSeccionPersonalizada(selected.seccionIndex!);
              }
            }}
            style={{
              padding: "8px 16px",
              background: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px"
            }}
          >
            🗑️ Eliminar Sección
          </button>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Título:
          </label>
          <input
            type="text"
            value={seccion.titulo}
            onChange={(e) => updateSeccionPersonalizada(selected.seccionIndex!, { titulo: e.target.value })}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Tipo de Elemento:
          </label>
          <select
            value={tiposComunes.includes(seccion.tipo_elemento) ? seccion.tipo_elemento : "OTRO"}
            onChange={(e) => {
              if (e.target.value === "OTRO") {
                const customTipo = window.prompt("Ingresa el tipo de elemento personalizado:", seccion.tipo_elemento);
                if (customTipo) {
                  updateSeccionPersonalizada(selected.seccionIndex!, { tipo_elemento: customTipo });
                }
              } else {
                updateSeccionPersonalizada(selected.seccionIndex!, { tipo_elemento: e.target.value });
              }
            }}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          >
            {tiposComunes.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
          <div style={{ fontSize: "12px", color: "#999", marginTop: "5px" }}>
            Selecciona "OTRO" para ingresar un tipo personalizado
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Nivel de Jerarquía:
          </label>
          <select
            value={seccion.nivel || 1}
            onChange={(e) => updateSeccionPersonalizada(selected.seccionIndex!, { nivel: parseInt(e.target.value) })}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          >
            <option value={1}>1 - Principal</option>
            <option value={2}>2 - Subsección</option>
            <option value={3}>3 - Detalle</option>
            <option value={4}>4 - Sub-detalle</option>
          </select>
          <div style={{ fontSize: "12px", color: "#999", marginTop: "5px" }}>
            El nivel determina la indentación visual en el árbol
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Contenido:
          </label>
          <textarea
            value={seccion.contenido || ""}
            onChange={(e) => updateSeccionPersonalizada(selected.seccionIndex!, { contenido: e.target.value })}
            style={{
              width: "100%",
              minHeight: "300px",
              padding: "12px",
              fontSize: "14px",
              fontFamily: "monospace",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box",
              resize: "vertical"
            }}
          />
          <div style={{ fontSize: "12px", color: "#999", marginTop: "5px" }}>
            {seccion.contenido?.length || 0} caracteres
          </div>
        </div>

        {/* Estado de revisión */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Estado de Revisión:
          </label>
          <select
            value={seccion.status || ""}
            onChange={(e) => updateSeccionPersonalizada(selected.seccionIndex!, { status: e.target.value as any })}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          >
            <option value="">Sin revisar</option>
            <option value="OK">✅ OK</option>
            <option value="Corregir">⚠️ Corregir</option>
            <option value="Duda">❓ Duda</option>
          </select>
        </div>

        {/* Notas de revisión */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Notas de Revisión:
          </label>
          <textarea
            value={seccion.notas_revision || ""}
            onChange={(e) => updateSeccionPersonalizada(selected.seccionIndex!, { notas_revision: e.target.value })}
            placeholder="Notas sobre correcciones necesarias, observaciones, etc."
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "12px",
              fontSize: "14px",
              fontFamily: "monospace",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box",
              resize: "vertical"
            }}
          />
        </div>

        {/* Error estructural */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
            Error Estructural:
          </label>
          <input
            type="text"
            value={seccion.error_estructural || ""}
            onChange={(e) => updateSeccionPersonalizada(selected.seccionIndex!, { error_estructural: e.target.value })}
            placeholder="Ej: Falta tabla, Debería ser cláusula, Mal parseado, etc."
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
          <div style={{ fontSize: "12px", color: "#999", marginTop: "5px" }}>
            Describe errores de parseo o estructura incorrecta
          </div>
        </div>

        {/* Información adicional */}
        <div style={{ padding: "15px", background: "#f5f5f5", borderRadius: "5px", marginTop: "30px" }}>
          <strong style={{ fontSize: "14px" }}>📊 Información:</strong>
          <div style={{ fontSize: "13px", marginTop: "8px", color: "#666" }}>
            • ID: {seccion.id}
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>
            • Orden: {seccion.orden !== undefined ? seccion.orden : "No definido"}
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>
            • Longitud: {seccion.contenido.length} caracteres
          </div>
          {seccion.numero !== undefined && (
            <div style={{ fontSize: "13px", color: "#666" }}>
              • Número: {seccion.numero}
            </div>
          )}
        </div>

        {/* Ayuda contextual */}
        <div style={{ padding: "15px", background: "#e3f2fd", borderRadius: "5px", marginTop: "20px", borderLeft: "4px solid #2196f3" }}>
          <strong style={{ fontSize: "14px", color: "#1976d2" }}>💡 Sugerencias de uso:</strong>
          <ul style={{ marginTop: "8px", fontSize: "13px", color: "#555", paddingLeft: "20px" }}>
            <li><strong>TABLA</strong>: Para tablas de datos, escalas salariales, cuadros comparativos</li>
            <li><strong>NOTA_ACLARATORIA</strong>: Para aclaraciones, observaciones o referencias</li>
            <li><strong>DISPOSICION_TRANSITORIA</strong>: Para disposiciones temporales o transitorias</li>
            <li><strong>FIRMANTES</strong>: Para secciones con firmas y datos de firmantes</li>
            <li><strong>FECHA_VIGENCIA</strong>: Para indicar fechas de entrada en vigencia</li>
            <li>O cualquier otro tipo que consideres necesario</li>
          </ul>
        </div>
      </div>
    );
  }

  return null;
}
