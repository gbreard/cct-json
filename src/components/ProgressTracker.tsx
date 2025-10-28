import { useDocStore } from "../state/useDocStore";

export default function ProgressTracker() {
  const { doc } = useDocStore();

  if (!doc) return null;

  // Calcular estadísticas
  const stats = {
    total: 0,
    ok: 0,
    corregir: 0,
    duda: 0,
    sinRevisar: 0
  };

  // Contar artículos
  if (doc.estructura.capitulos) {
    doc.estructura.capitulos.forEach(cap => {
      cap.articulos.forEach(art => {
        stats.total++;
        if (art.status === "OK") stats.ok++;
        else if (art.status === "Corregir") stats.corregir++;
        else if (art.status === "Duda") stats.duda++;
        else stats.sinRevisar++;
      });
    });
  }

  // Contar cláusulas
  if (doc.estructura.clausulas) {
    doc.estructura.clausulas.forEach(claus => {
      stats.total++;
      if (claus.status === "OK") stats.ok++;
      else if (claus.status === "Corregir") stats.corregir++;
      else if (claus.status === "Duda") stats.duda++;
      else stats.sinRevisar++;
    });
  }

  // Contar anexos
  if (doc.estructura.anexos) {
    doc.estructura.anexos.forEach(anexo => {
      stats.total++;
      if (anexo.status === "OK") stats.ok++;
      else if (anexo.status === "Corregir") stats.corregir++;
      else if (anexo.status === "Duda") stats.duda++;
      else stats.sinRevisar++;
    });
  }

  // Contar secciones personalizadas
  if (doc.estructura.secciones_personalizadas) {
    doc.estructura.secciones_personalizadas.forEach(seccion => {
      stats.total++;
      if (seccion.status === "OK") stats.ok++;
      else if (seccion.status === "Corregir") stats.corregir++;
      else if (seccion.status === "Duda") stats.duda++;
      else stats.sinRevisar++;
    });
  }

  if (stats.total === 0) return null;

  const revisados = stats.ok + stats.corregir + stats.duda;
  const porcentaje = Math.round((revisados / stats.total) * 100);

  return (
    <div style={{
      padding: "15px 20px",
      background: "#fff",
      borderBottom: "1px solid #ddd"
    }}>
      <div style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <strong style={{ fontSize: "14px" }}>Progreso de Revisión</strong>
          <span style={{ fontSize: "12px", color: "#666", marginLeft: "10px" }}>
            {revisados} de {stats.total} elementos revisados
          </span>
        </div>
        <div style={{ fontSize: "20px", fontWeight: "bold", color: porcentaje === 100 ? "#4caf50" : "#2196f3" }}>
          {porcentaje}%
        </div>
      </div>

      {/* Barra de progreso */}
      <div style={{
        width: "100%",
        height: "8px",
        background: "#e0e0e0",
        borderRadius: "4px",
        overflow: "hidden",
        marginBottom: "10px"
      }}>
        <div style={{
          display: "flex",
          height: "100%",
          width: "100%"
        }}>
          <div style={{
            width: `${(stats.ok / stats.total) * 100}%`,
            background: "#4caf50",
            transition: "width 0.3s"
          }} />
          <div style={{
            width: `${(stats.duda / stats.total) * 100}%`,
            background: "#ff9800",
            transition: "width 0.3s"
          }} />
          <div style={{
            width: `${(stats.corregir / stats.total) * 100}%`,
            background: "#f44336",
            transition: "width 0.3s"
          }} />
        </div>
      </div>

      {/* Leyenda */}
      <div style={{ display: "flex", gap: "15px", fontSize: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <div style={{ width: "12px", height: "12px", background: "#4caf50", borderRadius: "2px" }} />
          <span>OK: {stats.ok}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <div style={{ width: "12px", height: "12px", background: "#ff9800", borderRadius: "2px" }} />
          <span>Duda: {stats.duda}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <div style={{ width: "12px", height: "12px", background: "#f44336", borderRadius: "2px" }} />
          <span>Corregir: {stats.corregir}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <div style={{ width: "12px", height: "12px", background: "#9e9e9e", borderRadius: "2px" }} />
          <span>Sin revisar: {stats.sinRevisar}</span>
        </div>
      </div>
    </div>
  );
}
