interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export default function HelpModal({ open, onClose }: HelpModalProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "10px",
          maxWidth: "800px",
          maxHeight: "90vh",
          overflow: "auto",
          padding: "30px",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "15px",
            right: "15px",
            background: "transparent",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#666"
          }}
          title="Cerrar"
        >
          ×
        </button>

        <h2 style={{ marginTop: 0, color: "#2196f3" }}>📖 Guía de Uso - Editor CCT</h2>

        <section style={{ marginBottom: "30px" }}>
          <h3 style={{ color: "#333", borderBottom: "2px solid #2196f3", paddingBottom: "8px" }}>
            💾 Sistema de Guardado
          </h3>

          <p style={{ fontSize: "15px", lineHeight: "1.6", color: "#555" }}>
            El editor tiene <strong>dos tipos de guardado diferentes</strong>:
          </p>

          <div style={{ background: "#e3f2fd", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
            <h4 style={{ marginTop: 0, color: "#1976d2" }}>
              1️⃣ Guardado Automático (cada 30 segundos)
            </h4>
            <ul style={{ lineHeight: "1.8", color: "#333" }}>
              <li><strong>¿Dónde se guarda?</strong> En tu navegador (no se descarga nada)</li>
              <li><strong>¿Cuándo?</strong> Automáticamente cada 30 segundos mientras editás</li>
              <li><strong>Indicador:</strong> Mirá arriba a la derecha: "✓ Guardado hace X minutos"</li>
              <li><strong>Propósito:</strong> Protegerte si cerrás el navegador sin querer</li>
            </ul>

            <div style={{ background: "white", padding: "15px", borderRadius: "5px", marginTop: "15px" }}>
              <strong>¿Cómo recuperar cambios guardados automáticamente?</strong>
              <ol style={{ marginBottom: 0, paddingLeft: "20px", lineHeight: "1.8" }}>
                <li>Volvé a abrir el mismo documento desde el menú</li>
                <li>Si hay cambios guardados, aparece un mensaje preguntando</li>
                <li>Click en "Aceptar" → Tus cambios vuelven ✅</li>
                <li>Click en "Cancelar" → Carga la versión original</li>
              </ol>
            </div>
          </div>

          <div style={{ background: "#e8f5e9", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
            <h4 style={{ marginTop: 0, color: "#2e7d32" }}>
              2️⃣ Descarga del JSON Final (manual)
            </h4>
            <ul style={{ lineHeight: "1.8", color: "#333" }}>
              <li><strong>¿Dónde se guarda?</strong> En tu carpeta de Descargas</li>
              <li><strong>¿Cuándo?</strong> Cuando hacés click en el botón "💾 Guardar"</li>
              <li><strong>Archivo:</strong> Se llama <code style={{ background: "#f5f5f5", padding: "2px 6px", borderRadius: "3px" }}>nombreDocumento_editado_YYYYMMDD.json</code></li>
              <li><strong>Propósito:</strong> Esta es la versión final para entregar/procesar</li>
            </ul>

            <div style={{ background: "white", padding: "15px", borderRadius: "5px", marginTop: "15px" }}>
              <strong>Pasos para descargar:</strong>
              <ol style={{ marginBottom: 0, paddingLeft: "20px", lineHeight: "1.8" }}>
                <li>Click en el botón "💾 Guardar" (arriba en la barra)</li>
                <li>Se abre una ventana mostrando todos los cambios realizados</li>
                <li>Revisá los cambios en verde (agregados) y rojo (eliminados)</li>
                <li>Click en "Confirmar"</li>
                <li>El archivo JSON se descarga a tu carpeta de Descargas</li>
              </ol>
            </div>
          </div>

          <div style={{ background: "#fff3e0", padding: "15px", borderRadius: "8px", border: "2px solid #ff9800" }}>
            <strong>⚠️ Importante:</strong>
            <ul style={{ marginBottom: 0, lineHeight: "1.8", color: "#333" }}>
              <li>El guardado automático <strong>NO reemplaza</strong> la descarga final</li>
              <li>Cuando descargás el JSON final, el autosave se limpia automáticamente</li>
              <li>Podés trabajar con varios documentos a la vez, cada uno guarda sus cambios por separado</li>
              <li><strong>Siempre descargá el JSON final</strong> cuando termines de editar</li>
            </ul>
          </div>
        </section>

        <section style={{ marginBottom: "30px" }}>
          <h3 style={{ color: "#333", borderBottom: "2px solid #2196f3", paddingBottom: "8px" }}>
            🔍 Búsqueda en PDF
          </h3>
          <p style={{ fontSize: "15px", lineHeight: "1.6", color: "#555" }}>
            Al hacer click en un elemento del árbol (artículo, cláusula, etc.), el visor de PDF:
          </p>
          <ul style={{ lineHeight: "1.8", color: "#333" }}>
            <li>Busca automáticamente ese contenido en el PDF</li>
            <li>Navega a la página donde se encuentra</li>
            <li>Muestra un mensaje indicando si lo encontró o no</li>
          </ul>
          <div style={{ background: "#f5f5f5", padding: "10px", borderRadius: "5px", fontSize: "14px" }}>
            <strong>Nota:</strong> La precisión es de ~70% debido a variaciones en el OCR del PDF
          </div>
        </section>

        <section style={{ marginBottom: "30px" }}>
          <h3 style={{ color: "#333", borderBottom: "2px solid #2196f3", paddingBottom: "8px" }}>
            📐 Paneles Redimensionables
          </h3>
          <p style={{ fontSize: "15px", lineHeight: "1.6", color: "#555" }}>
            Podés ajustar el tamaño de los paneles según tu monitor:
          </p>
          <ul style={{ lineHeight: "1.8", color: "#333" }}>
            <li>Arrastrá las <strong>líneas grises</strong> entre paneles</li>
            <li>Se ponen azules cuando pasás el mouse por encima</li>
            <li>Ideal para pantallas chicas o grandes</li>
          </ul>
        </section>

        <section style={{ marginBottom: "30px" }}>
          <h3 style={{ color: "#333", borderBottom: "2px solid #2196f3", paddingBottom: "8px" }}>
            ✅ Validación de Documentos
          </h3>
          <p style={{ fontSize: "15px", lineHeight: "1.6", color: "#555" }}>
            Botón "✓ Validar" en la barra superior:
          </p>
          <ul style={{ lineHeight: "1.8", color: "#333" }}>
            <li>Verifica que el documento tenga la estructura correcta</li>
            <li>Detecta capítulos o artículos duplicados</li>
            <li>Muestra errores en un panel rojo si hay problemas</li>
            <li>Es recomendable validar antes de guardar</li>
          </ul>
        </section>

        <section>
          <h3 style={{ color: "#333", borderBottom: "2px solid #2196f3", paddingBottom: "8px" }}>
            🆘 Ayuda Adicional
          </h3>
          <p style={{ fontSize: "15px", lineHeight: "1.6", color: "#555", marginBottom: 0 }}>
            Si tenés problemas o dudas, consultá el archivo <code style={{ background: "#f5f5f5", padding: "2px 6px", borderRadius: "3px" }}>README.md</code> en la carpeta del proyecto.
          </p>
        </section>

        <div style={{ marginTop: "30px", textAlign: "center" }}>
          <button
            onClick={onClose}
            style={{
              padding: "12px 30px",
              background: "#2196f3",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
