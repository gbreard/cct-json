import Ajv from "ajv";
import addFormats from "ajv-formats";
import { CCT_SCHEMA } from "./schema";

export const ajv = new Ajv({
  allErrors: true,
  allowUnionTypes: true,
  coerceTypes: true,
  verbose: true
});

addFormats(ajv);

export const validateCCT = ajv.compile(CCT_SCHEMA);

// Validaciones custom adicionales
export function validateCapitulosUnicos(capitulos: any[]): string | null {
  const numeros = capitulos.map(c => c.numero);
  const duplicados = numeros.filter((n, i) => numeros.indexOf(n) !== i);
  if (duplicados.length > 0) {
    return `Capítulos duplicados: ${duplicados.join(", ")}`;
  }
  return null;
}

export function validateArticulosUnicos(articulos: any[]): string | null {
  const numeros = articulos.map(a => a.numero);
  const duplicados = numeros.filter((n, i) => numeros.indexOf(n) !== i);
  if (duplicados.length > 0) {
    return `Artículos duplicados: ${duplicados.join(", ")}`;
  }
  return null;
}

export function validateIncisosUnicos(incisos: any[]): string | null {
  const ids = incisos.map(i => i.identificador);
  const duplicados = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicados.length > 0) {
    return `Incisos duplicados: ${duplicados.join(", ")}`;
  }
  return null;
}
