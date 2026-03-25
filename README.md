# PeritApp — Deploy en Vercel

## Stack
- **Frontend**: HTML/CSS/JS estático en `/public`
- **Backend**: Vercel Serverless Functions en `/api`
- **IA Vision**: Gemini 1.5 Flash (GRATIS) o Claude Haiku (de pago)
- **MercadoLibre**: API pública gratuita, proxied desde el servidor
- **Dólar**: dolarapi.com, proxied desde el servidor

---

## PASO 1 — Crear cuenta en Google AI Studio (Gemini gratis)

1. Ir a https://aistudio.google.com/app/apikey
2. Iniciar sesión con cuenta Google
3. Click en **"Create API Key"**
4. Copiar la clave (empieza con `AIzaSy...`)

**Límites del tier gratuito:**
- 15 requests por minuto
- 1.500 requests por día
- Sin costo

---

## PASO 2 — Subir el código a GitHub

```bash
# Desde la carpeta del proyecto
git init
git add .
git commit -m "PeritApp MVP inicial"

# Crear repo en github.com y conectarlo
git remote add origin https://github.com/TU_USUARIO/peritapp.git
git push -u origin main
```

---

## PASO 3 — Deploy en Vercel

### Opción A — Interfaz web (más fácil)

1. Ir a https://vercel.com → "Add New Project"
2. Conectar con GitHub → seleccionar el repo `peritapp`
3. En la configuración del proyecto:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (dejar default)
   - **Build Command**: dejar vacío
   - **Output Directory**: `public`
4. Click **Deploy**

### Opción B — CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## PASO 4 — Configurar variables de entorno en Vercel

En el dashboard de Vercel → tu proyecto → **Settings → Environment Variables**:

| Variable | Valor | Notas |
|----------|-------|-------|
| `AI_PROVIDER` | `gemini` | Cambiar a `claude` si querés usar Anthropic |
| `GEMINI_API_KEY` | `AIzaSy...` | Obtenida en el Paso 1 |

Si querés usar Claude en vez de Gemini:

| Variable | Valor |
|----------|-------|
| `AI_PROVIDER` | `claude` |
| `ANTHROPIC_API_KEY` | `sk-ant-...` |

**Después de agregar las variables → "Redeploy"** para que tomen efecto.

---

## PASO 5 — Verificar que funciona

Una vez deployado, tu app va a estar en `https://tu-proyecto.vercel.app`

Testear los endpoints manualmente:
```
GET  https://tu-proyecto.vercel.app/api/dolar
GET  https://tu-proyecto.vercel.app/api/ml?q=paragolpes+gol+trend
POST https://tu-proyecto.vercel.app/api/analizar  (con body JSON)
```

---

## Estructura del proyecto

```
peritapp-vercel/
├── api/
│   ├── analizar.js   # IA Vision (Gemini o Claude)
│   ├── ml.js         # Proxy MercadoLibre Argentina
│   └── dolar.js      # Proxy cotización dólar blue
├── public/
│   └── index.html    # Frontend completo
├── vercel.json       # Configuración de rutas
├── package.json
└── .env.example      # Template de variables
```

---

## Costos

| Servicio | Plan | Costo |
|----------|------|-------|
| Vercel | Hobby (gratis) | $0 |
| Gemini Flash | Free tier | $0 (1500 req/día) |
| MercadoLibre API | Pública | $0 |
| dolarapi.com | Pública | $0 |
| **Total demo** | | **$0/mes** |

Cuando el cliente quiera producción real:
| Servicio | Costo estimado |
|----------|----------------|
| Gemini (si supera free tier) | $0.075 / 1M tokens imagen |
| Claude Haiku (alternativa) | ~$0.001 por análisis |
| Vercel Pro (si necesita más) | $20/mes |

---

## Para desarrollo local

```bash
# Instalar Vercel CLI
npm install -g vercel

# Crear .env.local con las variables
cp .env.example .env.local
# Editar .env.local y poner las claves reales

# Correr localmente con Vercel Dev (simula las API Routes)
vercel dev
# → http://localhost:3000
```
