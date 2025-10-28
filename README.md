# 📋 Editor de CCT - React + TypeScript

Editor web moderno para documentos de Convenios Colectivos de Trabajo (CCT) con validación automática, visualización de PDF y exportación estructurada.

## 🚀 Características

- ✅ **Interfaz de 3 paneles**: Árbol de navegación, editor de formularios y visor PDF
- ✅ **Validación en tiempo real**: Validación automática con JSON Schema y AJV
- ✅ **Diff visual**: Visualización de cambios antes de guardar
- ✅ **Exportación JSON**: Exporta el documento editado en formato JSON validado
- ✅ **Estado centralizado**: Una sola fuente de verdad con Zustand
- ✅ **Edición estructurada**: Agregar, editar y eliminar capítulos, artículos e incisos

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

