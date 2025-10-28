import type { CCTDocument } from "./types";

export function migrateV1toV2(doc: CCTDocument): CCTDocument {
  // Stub para futura migración de v1 a v2
  // Por ahora retorna el documento sin cambios
  return doc;
}

export function migrateToLatest(doc: any): CCTDocument {
  if (!doc.schemaVersion) {
    doc.schemaVersion = "v1";
  }

  // Aplicar migraciones según versión
  if (doc.schemaVersion === "v1") {
    // Ya está en v1, no hacer nada
    return doc;
  }

  return doc;
}
