import { useDocStore, type StatusFilter } from "../state/useDocStore";

export default function StatusFilterComponent() {
  const { statusFilter, setStatusFilter, doc } = useDocStore();

  const filters: { value: StatusFilter; label: string; color: string }[] = [
    { value: "ALL", label: "Todos", color: "#666" },
    { value: "OK", label: "OK", color: "#4caf50" },
    { value: "Corregir", label: "Corregir", color: "#f44336" },
    { value: "Duda", label: "Duda", color: "#ff9800" },
    { value: "Sin revisar", label: "Sin revisar", color: "#9e9e9e" }
  ];

  if (!doc) return null;

  // Calcular conteos
  const counts = {
    ALL: 0,
    OK: 0,
    Corregir: 0,
    Duda: 0,
    "Sin revisar": 0
  };

  if (doc.estructura.capitulos) {
    doc.estructura.capitulos.forEach(cap => {
      cap.articulos.forEach(art => {
        counts.ALL++;
        if (art.status === "OK") counts.OK++;
        else if (art.status === "Corregir") counts.Corregir++;
        else if (art.status === "Duda") counts.Duda++;
        else counts["Sin revisar"]++;
      });
    });
  }

  if (doc.estructura.clausulas) {
    doc.estructura.clausulas.forEach(claus => {
      counts.ALL++;
      if (claus.status === "OK") counts.OK++;
      else if (claus.status === "Corregir") counts.Corregir++;
      else if (claus.status === "Duda") counts.Duda++;
      else counts["Sin revisar"]++;
    });
  }

  return (
    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
      <span style={{ fontSize: "13px", color: "#666", marginRight: "5px" }}>
        Filtrar:
      </span>
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => setStatusFilter(filter.value)}
          style={{
            padding: "5px 12px",
            background: statusFilter === filter.value ? filter.color : "#f5f5f5",
            color: statusFilter === filter.value ? "white" : "#666",
            border: statusFilter === filter.value ? "none" : "1px solid #ddd",
            borderRadius: "15px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: statusFilter === filter.value ? "bold" : "normal",
            transition: "all 0.2s"
          }}
          title={`${filter.label}: ${counts[filter.value]} elementos`}
        >
          {filter.label} ({counts[filter.value]})
        </button>
      ))}
    </div>
  );
}
