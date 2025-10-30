import { create } from "zustand";
import type { CCTDocument, Path, Capitulo, Articulo, Clausula, IncisoDetectado, Anexo, SeccionPersonalizada, ConceptoDetectado } from "../lib/types";

export interface SearchResult {
  type: 'capitulo' | 'articulo' | 'inciso' | 'clausula' | 'preambulo';
  path: Path;
  text: string;
  matchText: string;
}

export type StatusFilter = "ALL" | "OK" | "Corregir" | "Duda" | "Sin revisar";

interface DocStore {
  doc: CCTDocument | null;
  original: CCTDocument | null;
  selected: Path | null;
  validationErrors: string[];
  searchTerm: string;
  searchResults: SearchResult[];
  currentSearchIndex: number;
  statusFilter: StatusFilter;

  // Actions
  setDoc: (doc: CCTDocument | null) => void;
  setOriginal: (doc: CCTDocument | null) => void;
  setSelected: (path: Path | null) => void;
  setValidationErrors: (errors: string[]) => void;
  setSearchTerm: (term: string) => void;
  performSearch: () => void;
  goToNextSearchResult: () => void;
  goToPrevSearchResult: () => void;
  clearSearch: () => void;
  setStatusFilter: (filter: StatusFilter) => void;

  // Mutations para Capítulos
  addCapitulo: (capitulo: Capitulo) => void;
  updateCapitulo: (capIndex: number, capitulo: Partial<Capitulo>) => void;
  deleteCapitulo: (capIndex: number) => void;
  reorderCapitulos: (fromIndex: number, toIndex: number) => void;

  // Mutations para Artículos
  addArticulo: (capIndex: number, articulo: Articulo) => void;
  updateArticulo: (capIndex: number, artIndex: number, articulo: Partial<Articulo>) => void;
  deleteArticulo: (capIndex: number, artIndex: number) => void;
  moveArticulo: (fromCapIndex: number, fromArtIndex: number, toCapIndex: number, toArtIndex: number) => void;

  // Mutations para Cláusulas
  addClausula: (clausula: Clausula) => void;
  updateClausula: (clausIndex: number, clausula: Partial<Clausula>) => void;
  deleteClausula: (clausIndex: number) => void;

  // Mutations para Anexos
  addAnexo: (anexo: Anexo) => void;
  updateAnexo: (anexoIndex: number, anexo: Partial<Anexo>) => void;
  deleteAnexo: (anexoIndex: number) => void;

  // Mutations para Secciones Personalizadas
  addSeccionPersonalizada: (seccion: SeccionPersonalizada) => void;
  updateSeccionPersonalizada: (seccionIndex: number, seccion: Partial<SeccionPersonalizada>) => void;
  deleteSeccionPersonalizada: (seccionIndex: number) => void;
  reorderSeccionesPersonalizadas: (fromIndex: number, toIndex: number) => void;

  // Mutations para Incisos
  addInciso: (capIndex: number, artIndex: number, inciso: IncisoDetectado) => void;
  updateInciso: (capIndex: number, artIndex: number, incIndex: number, inciso: Partial<IncisoDetectado>) => void;
  deleteInciso: (capIndex: number, artIndex: number, incIndex: number) => void;

  // Update preambulo
  updatePreambulo: (preambulo: string) => void;

  // Update estado revision
  setEstadoRevision: (estado: "pendiente" | "en_revision" | "terminado", userName?: string) => void;

  // Validación de conceptos (para Abogada 2 - especialista en tesauros)
  validarConcepto: (conceptoId: string, userName?: string) => void;
  corregirConcepto: (conceptoId: string, conceptoCorrecto: string, notas: string, userName?: string) => void;
  eliminarConcepto: (conceptoId: string, userName?: string) => void;
  agregarConceptoAArticulo: (capIndex: number, artIndex: number, concepto: ConceptoDetectado) => void;

  // Helpers
  getCapitulo: (capIndex: number) => Capitulo | undefined;
  getArticulo: (capIndex: number, artIndex: number) => Articulo | undefined;
  getClausula: (clausIndex: number) => Clausula | undefined;
}

export const useDocStore = create<DocStore>((set, get) => ({
  doc: null,
  original: null,
  selected: null,
  validationErrors: [],
  searchTerm: "",
  searchResults: [],
  currentSearchIndex: -1,
  statusFilter: "ALL",

  setDoc: (doc) => set({ doc, searchTerm: "", searchResults: [], currentSearchIndex: -1, statusFilter: "ALL" }),
  setOriginal: (original) => set({ original }),
  setSelected: (selected) => set({ selected }),
  setValidationErrors: (validationErrors) => set({ validationErrors }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),

  setSearchTerm: (term) => {
    set({ searchTerm: term });
    if (term.trim()) {
      get().performSearch();
    } else {
      set({ searchResults: [], currentSearchIndex: -1 });
    }
  },

  performSearch: () => {
    const { doc, searchTerm } = get();
    if (!doc || !searchTerm.trim()) {
      set({ searchResults: [], currentSearchIndex: -1 });
      return;
    }

    const results: SearchResult[] = [];
    const term = searchTerm.toLowerCase();

    // Buscar en preámbulo
    if (doc.estructura.preambulo) {
      const text = doc.estructura.preambulo.toLowerCase();
      if (text.includes(term)) {
        results.push({
          type: 'preambulo',
          path: { type: 'preambulo' },
          text: doc.estructura.preambulo,
          matchText: searchTerm
        });
      }
    }

    // Buscar en capítulos
    if (doc.estructura.capitulos) {
      doc.estructura.capitulos.forEach((cap, capIndex) => {
        // Buscar en título del capítulo
        if (cap.titulo?.toLowerCase().includes(term)) {
          results.push({
            type: 'capitulo',
            path: { type: 'capitulo', capituloIndex: capIndex },
            text: cap.titulo,
            matchText: searchTerm
          });
        }

        // Buscar en artículos
        cap.articulos.forEach((art, artIndex) => {
          // Buscar en título del artículo
          if (art.titulo?.toLowerCase().includes(term)) {
            results.push({
              type: 'articulo',
              path: { type: 'articulo', capituloIndex: capIndex, articuloIndex: artIndex },
              text: art.titulo,
              matchText: searchTerm
            });
          }

          // Buscar en contenido del artículo
          if (art.contenido?.toLowerCase().includes(term)) {
            results.push({
              type: 'articulo',
              path: { type: 'articulo', capituloIndex: capIndex, articuloIndex: artIndex },
              text: art.contenido,
              matchText: searchTerm
            });
          }

          // Buscar en incisos (pueden ser strings u objetos)
          art.incisos_detectados.forEach((inciso, incIndex) => {
            const isString = typeof inciso === 'string';
            const texto = isString ? inciso : (inciso.contenido || inciso.texto || "");

            if (texto && typeof texto === 'string' && texto.toLowerCase().includes(term)) {
              results.push({
                type: 'inciso',
                path: { type: 'inciso', capituloIndex: capIndex, articuloIndex: artIndex, incisoIndex: incIndex },
                text: texto,
                matchText: searchTerm
              });
            }
          });
        });
      });
    }

    // Buscar en cláusulas
    if (doc.estructura.clausulas) {
      doc.estructura.clausulas.forEach((clausula, clausIndex) => {
        if (clausula.titulo?.toLowerCase().includes(term)) {
          results.push({
            type: 'clausula',
            path: { type: 'clausula', clausulaIndex: clausIndex },
            text: clausula.titulo,
            matchText: searchTerm
          });
        }

        if (clausula.contenido?.toLowerCase().includes(term)) {
          results.push({
            type: 'clausula',
            path: { type: 'clausula', clausulaIndex: clausIndex },
            text: clausula.contenido,
            matchText: searchTerm
          });
        }
      });
    }

    set({
      searchResults: results,
      currentSearchIndex: results.length > 0 ? 0 : -1
    });

    // Seleccionar el primer resultado
    if (results.length > 0) {
      set({ selected: results[0].path });
    }
  },

  goToNextSearchResult: () => {
    const { searchResults, currentSearchIndex } = get();
    if (searchResults.length === 0) return;

    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    set({
      currentSearchIndex: nextIndex,
      selected: searchResults[nextIndex].path
    });
  },

  goToPrevSearchResult: () => {
    const { searchResults, currentSearchIndex } = get();
    if (searchResults.length === 0) return;

    const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    set({
      currentSearchIndex: prevIndex,
      selected: searchResults[prevIndex].path
    });
  },

  clearSearch: () => {
    set({ searchTerm: "", searchResults: [], currentSearchIndex: -1 });
  },

  // === CAPITULOS ===
  addCapitulo: (capitulo) => set((state) => {
    if (!state.doc) return state;
    // Inicializar array de capítulos si no existe
    const capitulos = state.doc.estructura.capitulos || [];
    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          capitulos: [...capitulos, capitulo]
        }
      }
    };
  }),

  updateCapitulo: (capIndex, updates) => set((state) => {
    if (!state.doc || !state.doc.estructura.capitulos) return state;
    const newCapitulos = [...state.doc.estructura.capitulos];
    newCapitulos[capIndex] = { ...newCapitulos[capIndex], ...updates };
    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          capitulos: newCapitulos
        }
      }
    };
  }),

  deleteCapitulo: (capIndex) => set((state) => {
    if (!state.doc || !state.doc.estructura.capitulos) return state;
    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          capitulos: state.doc.estructura.capitulos.filter((_, i) => i !== capIndex)
        }
      }
    };
  }),

  reorderCapitulos: (fromIndex, toIndex) => set((state) => {
    if (!state.doc || !state.doc.estructura.capitulos) return state;
    const newCapitulos = [...state.doc.estructura.capitulos];
    const [removed] = newCapitulos.splice(fromIndex, 1);
    newCapitulos.splice(toIndex, 0, removed);
    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          capitulos: newCapitulos
        }
      }
    };
  }),

  // === ARTICULOS ===
  addArticulo: (capIndex, articulo) => set((state) => {
    if (!state.doc || !state.doc.estructura.capitulos) return state;
    const newCapitulos = [...state.doc.estructura.capitulos];
    newCapitulos[capIndex] = {
      ...newCapitulos[capIndex],
      articulos: [...newCapitulos[capIndex].articulos, articulo]
    };
    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          capitulos: newCapitulos
        }
      }
    };
  }),

  updateArticulo: (capIndex, artIndex, updates) => set((state) => {
    if (!state.doc || !state.doc.estructura.capitulos) return state;
    const newCapitulos = [...state.doc.estructura.capitulos];
    const newArticulos = [...newCapitulos[capIndex].articulos];
    newArticulos[artIndex] = { ...newArticulos[artIndex], ...updates };
    newCapitulos[capIndex] = { ...newCapitulos[capIndex], articulos: newArticulos };
    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          capitulos: newCapitulos
        }
      }
    };
  }),

  deleteArticulo: (capIndex, artIndex) => set((state) => {
    if (!state.doc || !state.doc.estructura.capitulos) return state;
    const newCapitulos = [...state.doc.estructura.capitulos];
    newCapitulos[capIndex] = {
      ...newCapitulos[capIndex],
      articulos: newCapitulos[capIndex].articulos.filter((_, i) => i !== artIndex)
    };
    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          capitulos: newCapitulos
        }
      }
    };
  }),

  moveArticulo: (fromCapIndex, fromArtIndex, toCapIndex, toArtIndex) => set((state) => {
    if (!state.doc || !state.doc.estructura.capitulos) return state;
    const newCapitulos = [...state.doc.estructura.capitulos];

    // Obtener el artículo a mover
    const articulo = newCapitulos[fromCapIndex].articulos[fromArtIndex];

    // Remover del capítulo origen
    newCapitulos[fromCapIndex] = {
      ...newCapitulos[fromCapIndex],
      articulos: newCapitulos[fromCapIndex].articulos.filter((_, i) => i !== fromArtIndex)
    };

    // Agregar al capítulo destino
    const newArticulos = [...newCapitulos[toCapIndex].articulos];
    newArticulos.splice(toArtIndex, 0, articulo);
    newCapitulos[toCapIndex] = {
      ...newCapitulos[toCapIndex],
      articulos: newArticulos
    };

    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          capitulos: newCapitulos
        }
      }
    };
  }),

  // === CLAUSULAS ===
  addClausula: (clausula) => set((state) => {
    if (!state.doc) return state;
    // Inicializar array de cláusulas si no existe
    const clausulas = state.doc.estructura.clausulas || [];
    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          clausulas: [...clausulas, clausula]
        }
      }
    };
  }),

  updateClausula: (clausIndex, updates) => set((state) => {
    if (!state.doc || !state.doc.estructura.clausulas) return state;
    const newClausulas = [...state.doc.estructura.clausulas];
    newClausulas[clausIndex] = { ...newClausulas[clausIndex], ...updates };
    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          clausulas: newClausulas
        }
      }
    };
  }),

  deleteClausula: (clausIndex) => set((state) => {
    if (!state.doc || !state.doc.estructura.clausulas) return state;
    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          clausulas: state.doc.estructura.clausulas.filter((_, i) => i !== clausIndex)
        }
      }
    };
  }),

  // === ANEXOS ===
  addAnexo: (anexo) => set((state) => {
    if (!state.doc) return state;
    const anexos = state.doc.estructura.anexos || [];
    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          anexos: [...anexos, anexo]
        }
      }
    };
  }),

  updateAnexo: (anexoIndex, updates) => set((state) => {
    if (!state.doc || !state.doc.estructura.anexos) return state;
    const newAnexos = [...state.doc.estructura.anexos];
    newAnexos[anexoIndex] = { ...newAnexos[anexoIndex], ...updates };
    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          anexos: newAnexos
        }
      }
    };
  }),

  deleteAnexo: (anexoIndex) => set((state) => {
    if (!state.doc || !state.doc.estructura.anexos) return state;
    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          anexos: state.doc.estructura.anexos.filter((_, i) => i !== anexoIndex)
        }
      }
    };
  }),

  // === SECCIONES PERSONALIZADAS ===
  addSeccionPersonalizada: (seccion) => set((state) => {
    if (!state.doc) return state;
    const secciones = state.doc.estructura.secciones_personalizadas || [];
    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          secciones_personalizadas: [...secciones, seccion]
        }
      }
    };
  }),

  updateSeccionPersonalizada: (seccionIndex, updates) => set((state) => {
    if (!state.doc || !state.doc.estructura.secciones_personalizadas) return state;
    const newSecciones = [...state.doc.estructura.secciones_personalizadas];
    newSecciones[seccionIndex] = { ...newSecciones[seccionIndex], ...updates };
    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          secciones_personalizadas: newSecciones
        }
      }
    };
  }),

  deleteSeccionPersonalizada: (seccionIndex) => set((state) => {
    if (!state.doc || !state.doc.estructura.secciones_personalizadas) return state;
    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          secciones_personalizadas: state.doc.estructura.secciones_personalizadas.filter((_, i) => i !== seccionIndex)
        }
      }
    };
  }),

  reorderSeccionesPersonalizadas: (fromIndex, toIndex) => set((state) => {
    if (!state.doc || !state.doc.estructura.secciones_personalizadas) return state;
    const newSecciones = [...state.doc.estructura.secciones_personalizadas];
    const [removed] = newSecciones.splice(fromIndex, 1);
    newSecciones.splice(toIndex, 0, removed);

    // Actualizar el orden
    newSecciones.forEach((seccion, index) => {
      seccion.orden = index;
    });

    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          secciones_personalizadas: newSecciones
        }
      }
    };
  }),

  // === INCISOS ===
  addInciso: (capIndex, artIndex, inciso) => set((state) => {
    if (!state.doc || !state.doc.estructura.capitulos) return state;
    const newCapitulos = [...state.doc.estructura.capitulos];
    const newArticulos = [...newCapitulos[capIndex].articulos];
    const articulo = newArticulos[artIndex];
    newArticulos[artIndex] = {
      ...articulo,
      incisos_detectados: [...articulo.incisos_detectados, inciso]
    };
    newCapitulos[capIndex] = { ...newCapitulos[capIndex], articulos: newArticulos };
    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          capitulos: newCapitulos
        }
      }
    };
  }),

  updateInciso: (capIndex, artIndex, incIndex, updates) => set((state) => {
    if (!state.doc || !state.doc.estructura.capitulos) return state;
    const newCapitulos = [...state.doc.estructura.capitulos];
    const newArticulos = [...newCapitulos[capIndex].articulos];
    const newIncisos = [...newArticulos[artIndex].incisos_detectados];

    // Solo actualizar si el inciso es un objeto (no un string)
    const currentInciso = newIncisos[incIndex];
    if (typeof currentInciso !== 'string') {
      newIncisos[incIndex] = { ...currentInciso, ...updates };
    }

    newArticulos[artIndex] = { ...newArticulos[artIndex], incisos_detectados: newIncisos };
    newCapitulos[capIndex] = { ...newCapitulos[capIndex], articulos: newArticulos };
    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          capitulos: newCapitulos
        }
      }
    };
  }),

  deleteInciso: (capIndex, artIndex, incIndex) => set((state) => {
    if (!state.doc || !state.doc.estructura.capitulos) return state;
    const newCapitulos = [...state.doc.estructura.capitulos];
    const newArticulos = [...newCapitulos[capIndex].articulos];
    newArticulos[artIndex] = {
      ...newArticulos[artIndex],
      incisos_detectados: newArticulos[artIndex].incisos_detectados.filter((_, i) => i !== incIndex)
    };
    newCapitulos[capIndex] = { ...newCapitulos[capIndex], articulos: newArticulos };
    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          capitulos: newCapitulos
        }
      }
    };
  }),

  // === PREAMBULO ===
  updatePreambulo: (preambulo) => set((state) => {
    if (!state.doc) return state;
    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          preambulo
        }
      }
    };
  }),

  // === ESTADO REVISION ===
  setEstadoRevision: (estado, userName) => set((state) => {
    if (!state.doc) return state;

    const newMetadata = {
      ...state.doc.metadata,
      estado_revision: estado
    };

    // Si se marca como terminado, guardar fecha y usuario
    if (estado === "terminado") {
      newMetadata.fecha_terminado = new Date().toISOString();
      newMetadata.terminado_por = userName || localStorage.getItem('userName') || 'Usuario';
    }

    // Si se vuelve a estado anterior, limpiar datos de terminado
    if (estado !== "terminado") {
      delete newMetadata.fecha_terminado;
      delete newMetadata.terminado_por;
    }

    return {
      doc: {
        ...state.doc,
        metadata: newMetadata
      }
    };
  }),

  // === VALIDACIÓN DE CONCEPTOS ===
  validarConcepto: (conceptoId, userName) => set((state) => {
    if (!state.doc || !state.doc.estructura.capitulos) return state;

    const user = userName || localStorage.getItem('userName') || 'Usuario';
    const fechaValidacion = new Date().toISOString();

    // Actualizar el concepto en todos los artículos donde aparece
    const newCapitulos = state.doc.estructura.capitulos.map((cap) => ({
      ...cap,
      articulos: cap.articulos.map((art) => ({
        ...art,
        conceptos_detectados: art.conceptos_detectados.map((concepto) =>
          concepto.id === conceptoId
            ? {
                ...concepto,
                validado: true,
                validado_por: user,
                fecha_validacion: fechaValidacion,
                accion_validacion: "validar" as const
              }
            : concepto
        )
      }))
    }));

    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          capitulos: newCapitulos
        }
      }
    };
  }),

  corregirConcepto: (conceptoId, conceptoCorrecto, notas, userName) => set((state) => {
    if (!state.doc || !state.doc.estructura.capitulos) return state;

    const user = userName || localStorage.getItem('userName') || 'Usuario';
    const fechaValidacion = new Date().toISOString();

    // Actualizar el concepto en todos los artículos donde aparece
    const newCapitulos = state.doc.estructura.capitulos.map((cap) => ({
      ...cap,
      articulos: cap.articulos.map((art) => ({
        ...art,
        conceptos_detectados: art.conceptos_detectados.map((concepto) =>
          concepto.id === conceptoId
            ? {
                ...concepto,
                validado: false,
                validado_por: user,
                fecha_validacion: fechaValidacion,
                concepto_correcto: conceptoCorrecto,
                notas_validacion: notas,
                accion_validacion: "corregir" as const
              }
            : concepto
        )
      }))
    }));

    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          capitulos: newCapitulos
        }
      }
    };
  }),

  eliminarConcepto: (conceptoId, userName) => set((state) => {
    if (!state.doc || !state.doc.estructura.capitulos) return state;

    const user = userName || localStorage.getItem('userName') || 'Usuario';
    const fechaValidacion = new Date().toISOString();

    // Marcar el concepto como eliminado en todos los artículos donde aparece
    const newCapitulos = state.doc.estructura.capitulos.map((cap) => ({
      ...cap,
      articulos: cap.articulos.map((art) => ({
        ...art,
        conceptos_detectados: art.conceptos_detectados.map((concepto) =>
          concepto.id === conceptoId
            ? {
                ...concepto,
                validado: false,
                validado_por: user,
                fecha_validacion: fechaValidacion,
                accion_validacion: "eliminar" as const
              }
            : concepto
        )
      }))
    }));

    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          capitulos: newCapitulos
        }
      }
    };
  }),

  agregarConceptoAArticulo: (capIndex, artIndex, concepto) => set((state) => {
    if (!state.doc || !state.doc.estructura.capitulos) return state;

    const newCapitulos = [...state.doc.estructura.capitulos];
    const newArticulos = [...newCapitulos[capIndex].articulos];
    const articulo = newArticulos[artIndex];

    // Agregar el concepto con validación automática
    newArticulos[artIndex] = {
      ...articulo,
      conceptos_detectados: [
        ...articulo.conceptos_detectados,
        {
          ...concepto,
          validado: true,
          validado_por: localStorage.getItem('userName') || 'Usuario',
          fecha_validacion: new Date().toISOString(),
          accion_validacion: "validar" as const
        }
      ]
    };

    newCapitulos[capIndex] = { ...newCapitulos[capIndex], articulos: newArticulos };

    return {
      doc: {
        ...state.doc,
        estructura: {
          ...state.doc.estructura,
          capitulos: newCapitulos
        }
      }
    };
  }),

  // === HELPERS ===
  getCapitulo: (capIndex) => {
    const state = get();
    return state.doc?.estructura.capitulos?.[capIndex];
  },

  getArticulo: (capIndex, artIndex) => {
    const state = get();
    return state.doc?.estructura.capitulos?.[capIndex]?.articulos[artIndex];
  },

  getClausula: (clausIndex) => {
    const state = get();
    return state.doc?.estructura.clausulas?.[clausIndex];
  }
}));
