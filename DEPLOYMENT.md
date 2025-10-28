# 🚀 Guía de Deployment - Editor CCT

## 📋 Requisitos previos

1. ✅ Tener una cuenta de GitHub
2. ✅ Tu código debe estar en un repositorio de GitHub
3. ✅ Todos tus archivos JSON y PDFs deben estar en la carpeta `public/`

---

## 🏆 OPCIÓN 1: Vercel (RECOMENDADO)

### Paso 1: Crear cuenta en Vercel
1. Ir a [vercel.com](https://vercel.com)
2. Hacer clic en "Sign Up"
3. Elegir "Continue with GitHub"
4. Autorizar a Vercel para acceder a tus repositorios

### Paso 2: Importar proyecto
1. En el dashboard de Vercel, hacer clic en "Add New Project"
2. Buscar tu repositorio `cct-editor-react`
3. Hacer clic en "Import"

### Paso 3: Configurar el proyecto
```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Paso 4: Deploy
1. Hacer clic en "Deploy"
2. Esperar 2-3 minutos
3. ¡Listo! Vercel te da una URL: `https://tu-proyecto.vercel.app`

### ⚡ Deploy automático
Cada vez que hagas `git push` a tu repositorio, Vercel deployará automáticamente.

---

## 🎯 OPCIÓN 2: Netlify

### Paso 1: Crear cuenta en Netlify
1. Ir a [netlify.com](https://www.netlify.com)
2. Hacer clic en "Sign Up"
3. Elegir "Continue with GitHub"

### Paso 2: Importar proyecto
1. En el dashboard, hacer clic en "Add new site" → "Import an existing project"
2. Elegir "Deploy with GitHub"
3. Buscar tu repositorio `cct-editor-react`
4. Hacer clic en el repositorio

### Paso 3: Configurar build
```
Base directory: (dejar vacío)
Build command: npm run build
Publish directory: dist
```

### Paso 4: Deploy
1. Hacer clic en "Deploy site"
2. Esperar 2-3 minutos
3. Tu sitio estará en: `https://random-name-123.netlify.app`
4. Podés cambiar el nombre en Site settings → Change site name

---

## ☁️ OPCIÓN 3: Cloudflare Pages

### Paso 1: Crear cuenta en Cloudflare
1. Ir a [dash.cloudflare.com](https://dash.cloudflare.com)
2. Crear cuenta gratuita

### Paso 2: Crear proyecto en Pages
1. En el menú lateral, ir a "Workers & Pages"
2. Hacer clic en "Create application"
3. Elegir la pestaña "Pages"
4. Hacer clic en "Connect to Git"
5. Conectar tu GitHub y elegir el repositorio

### Paso 3: Configurar build
```
Framework preset: Vite
Build command: npm run build
Build output directory: dist
```

### Paso 4: Deploy
1. Hacer clic en "Save and Deploy"
2. Esperar 2-3 minutos
3. Tu sitio estará en: `https://tu-proyecto.pages.dev`

---

## 🔧 Configuración de los archivos

### Estructura de archivos requerida:
```
cct-editor-react/
├── public/
│   ├── jsons_parseados/
│   │   ├── CCT-130-75-Principal-1_HIBRIDO.json
│   │   └── ... (todos tus JSONs)
│   └── pdfs/
│       ├── CCT-130-75-Principal-1.pdf
│       └── ... (todos tus PDFs)
├── src/
├── vercel.json     ← Ya creado
├── netlify.toml    ← Ya creado
└── package.json
```

---

## ⚠️ Problemas comunes y soluciones

### ❌ Error: "Cannot find module"
**Solución:** Verificar que tu `package.json` incluya todas las dependencias.
```bash
npm install
```

### ❌ Error: "404 Not Found" al recargar una ruta
**Solución:** Ya está configurado en `vercel.json` y `netlify.toml` - hace redirect a `/index.html`

### ❌ Error: "PDF.js worker failed"
**Solución:** Ya están configurados los headers correctos en los archivos de configuración.

### ❌ Los archivos JSON/PDF no se encuentran
**Solución:** Asegurarse de que estén en `public/`, NO en `src/`

---

## 📊 Comparación de plataformas

| Característica | Vercel | Netlify | Cloudflare |
|---|---|---|---|
| Bandwidth gratuito | 100 GB/mes | 100 GB/mes | **Ilimitado** |
| Builds gratuitos | Ilimitados | 300 min/mes | 500/mes |
| Deploy automático | ✅ | ✅ | ✅ |
| SSL/HTTPS | ✅ | ✅ | ✅ |
| CDN Global | ✅ | ✅ | ✅ (el mejor) |
| Uso comercial | ❌ | ✅ | ✅ |
| Facilidad | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🎓 Recomendación final

**Para uso interno (abogadas de tu organización):**
→ **Vercel** o **Netlify** (más fáciles)

**Si esperás muchas visitas o PDFs grandes:**
→ **Cloudflare Pages** (bandwidth ilimitado)

**Si querés vender/comercializar la app:**
→ **Netlify** o **Cloudflare** (permiten uso comercial)

---

## 📝 Checklist antes de deployar

- [ ] Todos los JSON están en `public/jsons_parseados/`
- [ ] Todos los PDF están en `public/pdfs/`
- [ ] El código está en GitHub
- [ ] Probaste que `npm run build` funcione sin errores
- [ ] Verificaste que los archivos `vercel.json` y `netlify.toml` estén en la raíz

---

## 🆘 Soporte

Si tenés problemas, revisá:
1. Los logs de build en la plataforma que elegiste
2. La consola del navegador (F12) para errores en producción
3. Que las rutas de los archivos sean correctas

¡Suerte con el deployment! 🚀
