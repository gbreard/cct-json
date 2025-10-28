import { create as createDiff } from "jsondiffpatch";
import * as jsondiffpatch from "jsondiffpatch";

export const diff = createDiff({
  arrays: {
    detectMove: true,
    includeValueOnMove: true
  }
});

export function diffHtml(before: any, after: any): string {
  const delta = diff.diff(before, after);
  if (!delta) {
    return '<div style="padding: 20px; text-align: center; color: #666;">No hay diferencias</div>';
  }
  // @ts-ignore - formatters is available but not in types
  return jsondiffpatch.formatters?.html?.format(delta, before) || '<div>No se pudo generar diff</div>';
}

export function hasDifferences(before: any, after: any): boolean {
  const delta = diff.diff(before, after);
  return delta !== undefined;
}
