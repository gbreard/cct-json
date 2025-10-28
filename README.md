# 📋 Editor de CCT - React + TypeScript

Editor web moderno para documentos de Convenios Colectivos de Trabajo (CCT) con validación automática, visualización de PDF y exportación estructurada.

## 🚀 Características

- ✅ **Interfaz de 3 paneles redimensionables**: Árbol de navegación, editor de formularios y visor PDF
- ✅ **Guardado automático**: Los cambios se guardan cada 30 segundos en el navegador
- ✅ **Recuperación automática**: Al volver a abrir un documento, recupera tus cambios guardados
- ✅ **Búsqueda en PDF**: Selecciona un elemento y el PDF navega automáticamente a esa sección
- ✅ **Validación en tiempo real**: Validación automática con JSON Schema y AJV
- ✅ **Diff visual**: Visualización de cambios antes de guardar
- ✅ **Exportación JSON**: Exporta el documento editado en formato JSON validado
- ✅ **Estado centralizado**: Una sola fuente de verdad con Zustand
- ✅ **Edición estructurada**: Agregar, editar y eliminar capítulos, artículos, cláusulas, anexos y secciones personalizadas

## 📦 Para Usuario Final (Abogada)

### Setup Inicial (una sola vez)

1. Instalar Node.js desde https://nodejs.org/
2. Abrir terminal y ejecutar:
```bash
npm install -g http-server
```

### Uso Diario

1. Doble clic en: `iniciar.bat`
2. Se abre automáticamente en el navegador
3. Editar el documento
4. Guardar cuando termines

### 💾 Sistema de Guardado

El editor tiene **dos tipos de guardado**:

#### 1. Guardado Automático (cada 30 segundos)
- **¿Dónde?** En el navegador (localStorage)
- **¿Cuándo?** Automático cada 30 segundos mientras editás
- **Indicador:** "✓ Guardado hace X minutos" (arriba a la derecha)
- **Propósito:** Protege contra pérdida de datos si cerrás accidentalmente

**¿Cómo recuperar?**
1. Volvé a abrir el mismo documento
2. El sistema detecta que hay cambios guardados
3. Te pregunta: "¿Querés recuperar los cambios guardados?"
4. Click en "Aceptar" → Recupera tus cambios ✅

#### 2. Descarga del JSON Final (manual)
- **¿Dónde?** En tu carpeta de Descargas
- **¿Cuándo?** Cuando hacés click en "💾 Guardar"
- **Archivo:** `nombre_documento_editado_YYYYMMDD.json`
- **Propósito:** Versión final para entregar/usar

**Pasos:**
1. Click en "💾 Guardar" (arriba)
2. Revisá los cambios en el diff visual
3. Click en "Confirmar"
4. Se descarga el archivo JSON

**Importante:**
- El autosave NO reemplaza la descarga final
- Cuando descargás el JSON, el autosave se limpia automáticamente
- Podés editar varios documentos, cada uno guarda sus cambios por separado

### 🔍 Búsqueda en PDF

Al hacer click en un elemento del árbol (artículo, cláusula, etc.), el visor PDF:
- Busca automáticamente ese contenido en el PDF
- Navega a la página donde se encuentra
- Muestra un mensaje de éxito o aviso si no lo encuentra

**Precisión:** ~70% (puede fallar por diferencias de OCR)

## 🛠️ Para Desarrolladores

### Instalar dependencias
```bash
npm install
```

### Desarrollo
```bash
npm run dev
```

### Build producción
```bash
npm run build
```

### Generar distribución
```bash
npm run build
cd dist
# Crear archivo iniciar.bat (ver sección Scripts)
```

## 📋 Formato JSON

El archivo `public/cct.json` debe tener este formato:

```json
{
  "schemaVersion": "v1",
  "metadata": {
    "numero": "130/75",
    "titulo": "Convenio Colectivo de Trabajo"
  },
  "capitulos": [
    {
      "numero": "I",
      "titulo": "Título del Capítulo",
      "articulos": [
        {
          "numero": 1,
          "titulo": "Título del Artículo",
          "contenido": "Texto del artículo..."
        }
      ]
    }
  ]
}
```

## 🔧 Scripts de Distribución

Crear `iniciar.bat` en la carpeta `dist/`:

```batch
@echo off
echo Iniciando Editor de CCT...
http-server -o -p 8080
```

## 📝 Reglas de Validación

- Capítulos: números romanos únicos (I-XXX)
- Artículos: números enteros únicos por capítulo
- Contenido mínimo: 10 caracteres
- Incisos: identificadores únicos (a-z, 0-9)

## 🐛 Solución de Problemas

**PDF no carga**: Colocar `cct.pdf` en carpeta `public/`
**Documento no carga**: Verificar formato de `cct.json`
**Error validación**: Usar botón "Validar" para ver errores

## 🔧 Tecnologías

React 18, TypeScript, Vite, Zustand, RJSF, AJV, react-pdf, jsondiffpatch

