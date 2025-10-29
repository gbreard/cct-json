import type { CCTDocument } from "./types";

export interface ProgressStats {
  totalElementos: number;
  elementosOK: number;
  elementosDuda: number;
  elementosCorregir: number;
  elementosPendientes: number;
  porcentajeRevisado: number;
  estadoManual: "pendiente" | "en_revision" | "terminado";
  desglose: {
    articulos: { total: number; ok: number; duda: number; corregir: number; pendientes: number };
    incisos: { total: number; ok: number; duda: number; corregir: number; pendientes: number };
    clausulas: { total: number; ok: number; duda: number; corregir: number; pendientes: number };
    anexos: { total: number; ok: number; duda: number; corregir: number; pendientes: number };
    seccionesPersonalizadas: { total: number; ok: number; duda: number; corregir: number; pendientes: number };
  };
}

export function calculateProgress(doc: CCTDocument | null): ProgressStats {
  if (!doc || !doc.estructura) {
    return {
      totalElementos: 0,
      elementosOK: 0,
      elementosDuda: 0,
      elementosCorregir: 0,
      elementosPendientes: 0,
      porcentajeRevisado: 0,
      estadoManual: doc?.metadata?.estado_revision || "pendiente",
      desglose: {
        articulos: { total: 0, ok: 0, duda: 0, corregir: 0, pendientes: 0 },
        incisos: { total: 0, ok: 0, duda: 0, corregir: 0, pendientes: 0 },
        clausulas: { total: 0, ok: 0, duda: 0, corregir: 0, pendientes: 0 },
        anexos: { total: 0, ok: 0, duda: 0, corregir: 0, pendientes: 0 },
        seccionesPersonalizadas: { total: 0, ok: 0, duda: 0, corregir: 0, pendientes: 0 }
      }
    };
  }

  const stats: ProgressStats = {
    totalElementos: 0,
    elementosOK: 0,
    elementosDuda: 0,
    elementosCorregir: 0,
    elementosPendientes: 0,
    porcentajeRevisado: 0,
    estadoManual: doc.metadata?.estado_revision || "pendiente",
    desglose: {
      articulos: { total: 0, ok: 0, duda: 0, corregir: 0, pendientes: 0 },
      incisos: { total: 0, ok: 0, duda: 0, corregir: 0, pendientes: 0 },
      clausulas: { total: 0, ok: 0, duda: 0, corregir: 0, pendientes: 0 },
      anexos: { total: 0, ok: 0, duda: 0, corregir: 0, pendientes: 0 },
      seccionesPersonalizadas: { total: 0, ok: 0, duda: 0, corregir: 0, pendientes: 0 }
    }
  };

  // Contar artículos
  if (doc.estructura.capitulos) {
    doc.estructura.capitulos.forEach((cap) => {
      cap.articulos.forEach((art) => {
        stats.desglose.articulos.total++;
        stats.totalElementos++;

        if (art.status === "OK") {
          stats.desglose.articulos.ok++;
          stats.elementosOK++;
        } else if (art.status === "Duda") {
          stats.desglose.articulos.duda++;
          stats.elementosDuda++;
        } else if (art.status === "Corregir") {
          stats.desglose.articulos.corregir++;
          stats.elementosCorregir++;
        } else {
          stats.desglose.articulos.pendientes++;
          stats.elementosPendientes++;
        }

        // Contar incisos
        if (art.incisos_detectados && Array.isArray(art.incisos_detectados)) {
          art.incisos_detectados.forEach((inciso) => {
            stats.desglose.incisos.total++;
            stats.totalElementos++;

            if (typeof inciso === "string") {
              // String inciso - sin status
              stats.desglose.incisos.pendientes++;
              stats.elementosPendientes++;
            } else {
              // Object inciso
              if (inciso.status === "OK") {
                stats.desglose.incisos.ok++;
                stats.elementosOK++;
              } else if (inciso.status === "Duda") {
                stats.desglose.incisos.duda++;
                stats.elementosDuda++;
              } else if (inciso.status === "Corregir") {
                stats.desglose.incisos.corregir++;
                stats.elementosCorregir++;
              } else {
                stats.desglose.incisos.pendientes++;
                stats.elementosPendientes++;
              }
            }
          });
        }
      });
    });
  }

  // Contar cláusulas
  if (doc.estructura.clausulas) {
    doc.estructura.clausulas.forEach((clausula) => {
      stats.desglose.clausulas.total++;
      stats.totalElementos++;

      if (clausula.status === "OK") {
        stats.desglose.clausulas.ok++;
        stats.elementosOK++;
      } else if (clausula.status === "Duda") {
        stats.desglose.clausulas.duda++;
        stats.elementosDuda++;
      } else if (clausula.status === "Corregir") {
        stats.desglose.clausulas.corregir++;
        stats.elementosCorregir++;
      } else {
        stats.desglose.clausulas.pendientes++;
        stats.elementosPendientes++;
      }
    });
  }

  // Contar anexos
  if (doc.estructura.anexos) {
    doc.estructura.anexos.forEach((anexo) => {
      stats.desglose.anexos.total++;
      stats.totalElementos++;

      if (anexo.status === "OK") {
        stats.desglose.anexos.ok++;
        stats.elementosOK++;
      } else if (anexo.status === "Duda") {
        stats.desglose.anexos.duda++;
        stats.elementosDuda++;
      } else if (anexo.status === "Corregir") {
        stats.desglose.anexos.corregir++;
        stats.elementosCorregir++;
      } else {
        stats.desglose.anexos.pendientes++;
        stats.elementosPendientes++;
      }
    });
  }

  // Contar secciones personalizadas
  if (doc.estructura.secciones_personalizadas) {
    doc.estructura.secciones_personalizadas.forEach((seccion) => {
      stats.desglose.seccionesPersonalizadas.total++;
      stats.totalElementos++;

      if (seccion.status === "OK") {
        stats.desglose.seccionesPersonalizadas.ok++;
        stats.elementosOK++;
      } else if (seccion.status === "Duda") {
        stats.desglose.seccionesPersonalizadas.duda++;
        stats.elementosDuda++;
      } else if (seccion.status === "Corregir") {
        stats.desglose.seccionesPersonalizadas.corregir++;
        stats.elementosCorregir++;
      } else {
        stats.desglose.seccionesPersonalizadas.pendientes++;
        stats.elementosPendientes++;
      }
    });
  }

  // Calcular porcentaje
  const elementosRevisados = stats.elementosOK + stats.elementosDuda + stats.elementosCorregir;
  stats.porcentajeRevisado = stats.totalElementos > 0
    ? Math.round((elementosRevisados / stats.totalElementos) * 100)
    : 0;

  return stats;
}

export function getEstadoLabel(estado: "pendiente" | "en_revision" | "terminado"): string {
  switch (estado) {
    case "pendiente":
      return "⚪ PENDIENTE";
    case "en_revision":
      return "🟡 EN REVISIÓN";
    case "terminado":
      return "✅ TERMINADO";
    default:
      return "⚪ PENDIENTE";
  }
}

export function getEstadoColor(estado: "pendiente" | "en_revision" | "terminado"): string {
  switch (estado) {
    case "pendiente":
      return "#999";
    case "en_revision":
      return "#ff9800";
    case "terminado":
      return "#4caf50";
    default:
      return "#999";
  }
}
