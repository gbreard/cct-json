export const CCT_SCHEMA = {
  $id: "CCT",
  type: "object",
  required: ["schemaVersion", "metadata", "capitulos"],
  properties: {
    schemaVersion: { type: "string", const: "v1" },
    metadata: {
      type: "object",
      required: ["numero"],
      properties: {
        numero: { type: "string", pattern: "^\\d+/\\d{2,4}$" },
        titulo: { type: "string" },
        vigencia: {
          type: "object",
          properties: {
            desde: { type: "string", format: "date" },
            hasta: { type: "string", format: "date" }
          }
        }
      },
      additionalProperties: true
    },
    capitulos: {
      type: "array",
      items: {
        type: "object",
        required: ["numero", "titulo", "articulos"],
        properties: {
          numero: {
            type: "string",
            pattern: "^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX|XXI|XXII|XXIII|XXIV|XXV|XXVI|XXVII|XXVIII|XXIX|XXX)$"
          },
          titulo: { type: "string", minLength: 3 },
          source_ref: {
            type: "object",
            properties: { page: { type: "integer", minimum: 1 } },
            additionalProperties: true
          },
          articulos: {
            type: "array",
            items: {
              type: "object",
              required: ["numero", "contenido"],
              properties: {
                numero: { type: "integer", minimum: 1 },
                titulo: { type: "string" },
                contenido: { type: "string", minLength: 10 },
                source_ref: {
                  type: "object",
                  properties: { page: { type: "integer", minimum: 1 } },
                  additionalProperties: true
                },
                incisos: {
                  type: "array",
                  uniqueItems: true,
                  items: {
                    type: "object",
                    required: ["identificador", "texto"],
                    properties: {
                      identificador: { type: "string", pattern: "^[a-z0-9]$" },
                      texto: { type: "string", minLength: 1 },
                      source_ref: {
                        type: "object",
                        properties: { page: { type: "integer", minimum: 1 } },
                        additionalProperties: true
                      }
                    },
                    additionalProperties: false
                  }
                }
              },
              additionalProperties: false
            }
          }
        },
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
} as const;
