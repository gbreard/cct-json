// Tipos TypeScript para documentos CCT parseados

export interface Metadata {
  nombre_archivo: string;
  tipo_documento: "CCT_PRINCIPAL" | "ACUERDO" | "CCT_HOMOLOGADO" | "INFO" | "HOM" | "CON" | string;
  numero_cct: string | null;
  fecha_parseo: string;
  longitud_texto: number;
  version_tesauro: string;
}

export interface ConceptoDetectado {
  id: string;
  termino: string;
  frecuencia: number;
  posiciones: number[];
  confianza: number;
  terminos_encontrados: string[];
}

export interface TablaDetectada {
  [key: string]: any; // Estructura flexible para tablas
}

// Estructura específica para tablas editables
export interface TablaEditable {
  headers: string[];
  rows: string[][];
}

export interface IncisoDetectado {
  identificador: string;
  texto: string;
  contenido?: string;
  status?: "OK" | "Corregir" | "Duda";
  notas_revision?: string;
  [key: string]: any;
}

export interface Articulo {
  numero: number;
  titulo?: string;
  contenido: string;
  longitud_caracteres?: number;
  longitud_lineas?: number;
  incisos_detectados: (IncisoDetectado | string)[]; // Puede ser array de objetos o strings
  num_incisos: number;
  conceptos_detectados: ConceptoDetectado[];
  tablas_detectadas?: TablaDetectada[]; // Opcional porque algunos JSONs no lo tienen
  contiene_tabla?: boolean; // Indica si el artículo contiene una tabla editable
  tabla_editable?: TablaEditable; // Tabla estructurada editable en el editor
  status?: "OK" | "Corregir" | "Duda";
  notas_revision?: string; // Notas sobre errores de parseo o correcciones necesarias
  error_estructural?: string; // Descripción de error estructural (ej: "Falta tabla", "Debería ser cláusula")
}

export interface Capitulo {
  numero: number;
  numero_romano?: string;
  titulo: string;
  articulos: Articulo[];
  status?: "OK" | "Corregir" | "Duda";
  notas_revision?: string;
  error_estructural?: string;
}

export interface Clausula {
  numero: number;
  titulo: string;
  ordinal?: string;
  contenido: string;
  longitud_caracteres: number;
  longitud_lineas: number;
  incisos_detectados: IncisoDetectado[];
  num_incisos: number;
  conceptos_detectados: ConceptoDetectado[];
  tablas_detectadas: TablaDetectada[];
  contiene_tabla?: boolean; // Indica si la cláusula contiene una tabla editable
  tabla_editable?: TablaEditable; // Tabla estructurada editable en el editor
  status?: "OK" | "Corregir" | "Duda";
  notas_revision?: string;
  error_estructural?: string;
}

export interface Anexo {
  numero: number;
  titulo: string;
  contenido: string;
  tipo?: string; // "TABLA" | "ESCALA_SALARIAL" | "DOCUMENTO" | "OTRO"
  longitud_caracteres?: number;
  tablas_detectadas: TablaDetectada[];
  contiene_tabla?: boolean; // Indica si el anexo contiene una tabla editable
  tabla_editable?: TablaEditable; // Tabla estructurada editable en el editor
  status?: "OK" | "Corregir" | "Duda";
  notas_revision?: string;
}

export interface SeccionPersonalizada {
  id: string; // ID único para identificar la sección
  numero?: number;
  titulo: string;
  tipo_elemento: string; // "TABLA" | "NOTA_ACLARATORIA" | "ESCALA" | "DISPOSICION" | "FIRMANTES" | "OTRO" | cualquier texto libre
  contenido: string;
  contenido_estructurado?: any; // Para guardar datos estructurados (tablas, etc.)
  nivel?: number; // Nivel de jerarquía (1=principal, 2=subsección, etc.)
  orden?: number; // Para ordenamiento
  status?: "OK" | "Corregir" | "Duda";
  notas_revision?: string;
  error_estructural?: string;
  metadata?: Record<string, any>; // Metadatos flexibles
}

export interface Estructura {
  tipo: "CCT_CON_CAPITULOS" | "ACUERDO" | "CCT_SIN_ESTRUCTURA" | "PERSONALIZADO" | string;
  preambulo?: string;
  capitulos?: Capitulo[];
  clausulas?: Clausula[];
  anexos?: Anexo[];
  secciones_personalizadas?: SeccionPersonalizada[]; // Para elementos no estructurados o personalizados
  notas_estructura?: string; // Notas generales sobre problemas estructurales del documento
}

export interface Validacion {
  tipo_documento: string;
  nombre_archivo: string;
  capitulos_validados: number;
  articulos_validados: number;
  clausulas_validadas?: number;
  total_conceptos_unicos: number;
  conceptos_principales_documento: ConceptoDetectado[];
  cobertura_tesauro: number;
  advertencias_globales: string[];
}

export interface CCTDocument {
  metadata: Metadata;
  estructura: Estructura;
  validacion: Validacion;
}

// Para navegación en el árbol
export type Path = {
  type: "capitulo" | "articulo" | "clausula" | "preambulo" | "anexo" | "inciso" | "seccion_personalizada";
  capituloIndex?: number; // Renombrado para consistencia
  articuloIndex?: number; // Renombrado para consistencia
  clausulaIndex?: number; // Renombrado para consistencia
  anexoIndex?: number;
  incisoIndex?: number;
  seccionIndex?: number; // Para secciones personalizadas
  // Mantener compatibilidad con nombres antiguos
  capIndex?: number;
  artIndex?: number;
  clausIndex?: number;
};

// Para el selector de documentos
export interface DocumentInfo {
  fileName: string;
  filePath: string;
  tipo_documento: string;
  fecha_parseo: string;
}
