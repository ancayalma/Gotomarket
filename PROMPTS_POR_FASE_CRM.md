# 📋 PROMPTS POR FASE — CRM Grenoucerie

> Usa este fichero como índice. Cuando abras un nuevo chat, copia el prompt de la fase en la que estés.

---

## 📌 ÍNDICE DE FASES

| Fase | Qué cubre | Estado |
|------|-----------|--------|
| [FASE 1](#fase-1) | Clonar BasaltCRM + limpiar dependencias de pago | ⬜ Por hacer |
| [FASE 2](#fase-2) | Cambiar MongoDB → PostgreSQL | ⬜ Por hacer |
| [FASE 3](#fase-3) | Personalizar diseño (colores, español, logo) | ⬜ Por hacer |
| [FASE 4](#fase-4) | Sistema agéntico con CrewAI + OpenRouter | ⬜ Por hacer |
| [FASE 5](#fase-5) | Despliegue en Vercel (CRM) + Railway (agentes) | ⬜ Por hacer |

> Cuando completes una fase, cambia ⬜ por ✅ para saber dónde estás.

---

## CONTEXTO BASE (incluido en todos los prompts)

> *Este bloque de contexto está embebido en cada prompt de abajo — no necesitas copiarlo por separado.*

---

---

## FASE 1

### ✂️ COPIA ESTE PROMPT AL ABRIR UN NUEVO CHAT ✂️

---

Hola. Voy a empezar un proyecto de CRM para mi empresa. Aquí está todo el contexto antes de empezar:

### MI EMPRESA

Tengo un holding empresarial (FEROD) con 3 mercados:
- **España** (Grenoucerie)
- **Francia** (Grenoucerie FR)
- **Petfood** (línea de productos para mascotas)

No tengo conocimientos técnicos — necesito instrucciones paso a paso.

### MI STACK TÉCNICO

| Componente | Detalle |
|---|---|
| Dashboard existente | React + Node.js en Vercel → https://grenoucerie-dashboard.vercel.app/ |
| CRM que vamos a construir | BasaltCRM (fork) — Next.js 16 + TypeScript + Shadcn/ui + Prisma |
| Base de datos | PostgreSQL |
| Agentes IA | CrewAI + OpenRouter (microservicio Python separado) |
| LLM inicial | OpenRouter (modelos gratuitos: DeepSeek, Llama, Qwen) |
| LLM futuro | Anthropic Claude (migración: cambiar 2 variables de entorno) |
| Colores | Pistacho `#93C572`, Oliva `#808000`, Oliva claro `#BAB86C`, Verde salvia `#9DC183` |

### REPOSITORIOS A USAR

- CRM base: `https://github.com/BasaltHQ/crm-official` (licencia MIT)
- Agentes base: `https://github.com/zloeber/crewai-openrouter-lab`

### ESTADO ACTUAL DEL PROYECTO

🆕 Empezando desde cero. Aún no he clonado nada.

### LO QUE NECESITO HACER AHORA — FASE 1

**Objetivo**: Clonar BasaltCRM en mi máquina y hacer la limpieza de dependencias de pago.

Concretamente:
1. Clonar `https://github.com/BasaltHQ/crm-official`
2. Eliminar o desactivar todo lo relacionado con:
   - ❌ AWS (Amazon Connect, Chime, SES, Pinpoint, Textract, S3) — carpeta `/aws` completa
   - ❌ Azure OpenAI (ya no se usa — usaremos OpenRouter)
   - ❌ Firecrawl (scraping de pago)
   - ❌ Stripe (no necesitamos cobrar a usuarios)
   - ❌ Upstash Redis (eliminar o sustituir)
3. Verificar que el proyecto arranca en local después de la limpieza

### REGLAS DE TRABAJO

- Siempre en **español**
- Comentarios en el código en español
- Sin tecnicismos innecesarios — explica como si no sé programar
- Stack CRM: React + Node.js + PostgreSQL + Vercel
- Stack agentes: Python + CrewAI + OpenRouter

Dame las instrucciones paso a paso para empezar: cómo clonar el repositorio.

---

### ✂️ FIN DEL PROMPT FASE 1 ✂️

---

---

## FASE 2

### ✂️ COPIA ESTE PROMPT AL ABRIR UN NUEVO CHAT ✂️

---

Hola. Estoy construyendo un CRM para mi empresa y necesito continuar desde donde lo dejé. Aquí está todo el contexto:

### MI EMPRESA

Holding empresarial (FEROD) con 3 mercados: España (Grenoucerie), Francia (Grenoucerie FR), Petfood.
No tengo conocimientos técnicos — necesito instrucciones paso a paso.

### MI STACK TÉCNICO

| Componente | Detalle |
|---|---|
| CRM | Fork de BasaltCRM — Next.js 16 + TypeScript + Shadcn/ui + Prisma |
| Base de datos objetivo | PostgreSQL |
| Agentes IA | CrewAI + OpenRouter (microservicio Python separado — fase posterior) |
| Colores | Pistacho `#93C572`, Oliva `#808000`, Oliva claro `#BAB86C`, Verde salvia `#9DC183` |

### ESTADO ACTUAL DEL PROYECTO

✅ FASE 1 completada:
- Repositorio clonado localmente desde `https://github.com/BasaltHQ/crm-official`
- Dependencias de pago eliminadas (AWS, Azure OpenAI, Firecrawl, Stripe, Upstash Redis)
- El proyecto arranca en local sin errores relacionados con esas dependencias

### LO QUE NECESITO HACER AHORA — FASE 2

**Objetivo**: Cambiar la base de datos de MongoDB a PostgreSQL usando Prisma.

Concretamente:
1. Revisar el schema actual de Prisma (`prisma/schema.prisma`)
2. Cambiar el provider de MongoDB a PostgreSQL
3. Adaptar los modelos del schema para que sean compatibles con PostgreSQL
4. Configurar la variable de entorno `DATABASE_URL` apuntando a mi PostgreSQL local
5. Ejecutar las migraciones de Prisma
6. Verificar que el CRM arranca y conecta con PostgreSQL correctamente

### REGLAS DE TRABAJO

- Siempre en **español**, comentarios en español
- Sin tecnicismos — paso a paso
- Stack: Next.js + TypeScript + Prisma + PostgreSQL

Empieza mostrándome el contenido del schema de Prisma actual y dime qué hay que cambiar.

---

### ✂️ FIN DEL PROMPT FASE 2 ✂️

---

---

## FASE 3

### ✂️ COPIA ESTE PROMPT AL ABRIR UN NUEVO CHAT ✂️

---

Hola. Estoy construyendo un CRM para mi empresa y necesito continuar desde donde lo dejé. Aquí está todo el contexto:

### MI EMPRESA

Holding empresarial (FEROD) con 3 mercados: España (Grenoucerie), Francia (Grenoucerie FR), Petfood.
No tengo conocimientos técnicos — necesito instrucciones paso a paso.

### MI STACK TÉCNICO

| Componente | Detalle |
|---|---|
| CRM | Fork de BasaltCRM — Next.js 16 + TypeScript + Shadcn/ui + Prisma |
| Base de datos | PostgreSQL (ya configurado y funcionando) |
| Agentes IA | CrewAI + OpenRouter (microservicio Python — fase posterior) |
| Colores objetivo | Pistacho `#93C572`, Oliva `#808000`, Oliva claro `#BAB86C`, Verde salvia `#9DC183` |

### ESTADO ACTUAL DEL PROYECTO

✅ FASE 1 completada: Repositorio limpio (sin AWS, Stripe, etc.)
✅ FASE 2 completada: PostgreSQL configurado, migraciones ejecutadas, CRM arranca correctamente

### LO QUE NECESITO HACER AHORA — FASE 3

**Objetivo**: Personalizar el diseño del CRM con la identidad de Grenoucerie.

Concretamente:
1. **Colores**: Reemplazar el tema de BasaltCRM por el tema pistacho/oliva de mi empresa en los archivos de Tailwind/Shadcn
2. **Nombre y logo**: Cambiar todas las menciones de "BasaltCRM" por "Grenoucerie CRM"
3. **Idioma**: Activar las traducciones en español (carpeta `/locales`) y establecerlo como idioma por defecto
4. **Tipografía**: Revisar si la fuente actual es adecuada o si hay que cambiarla
5. **Verificación visual**: Comprobar que el CRM se ve correctamente en navegador con los nuevos colores

### REGLAS DE TRABAJO

- Siempre en **español**, comentarios en español
- Sin tecnicismos — paso a paso
- Diseño: interfaz limpia e intuitiva, drag & drop donde sea posible

Empieza mostrándome cómo están definidos los colores actualmente en el proyecto (archivo de configuración de Tailwind o variables CSS).

---

### ✂️ FIN DEL PROMPT FASE 3 ✂️

---

---

## FASE 4

### ✂️ COPIA ESTE PROMPT AL ABRIR UN NUEVO CHAT ✂️

---

Hola. Estoy construyendo un CRM para mi empresa y necesito continuar con la parte de inteligencia artificial. Aquí está todo el contexto:

### MI EMPRESA

Holding empresarial (FEROD) con 3 mercados: España (Grenoucerie), Francia (Grenoucerie FR), Petfood.
No tengo conocimientos técnicos — necesito instrucciones paso a paso.

### MI STACK TÉCNICO

| Componente | Detalle |
|---|---|
| CRM | Fork de BasaltCRM — Next.js 16 + TypeScript + Shadcn/ui + Prisma + PostgreSQL |
| URL local CRM | http://localhost:3000 |
| Framework agentes | CrewAI (Python) |
| LLM | OpenRouter — API compatible con OpenAI |
| LLM futuro | Anthropic Claude (migración: cambiar 2 variables de entorno) |
| Repositorio base agentes | https://github.com/zloeber/crewai-openrouter-lab |

### ESTADO ACTUAL DEL PROYECTO

✅ FASE 1 completada: Repositorio CRM limpio
✅ FASE 2 completada: PostgreSQL funcionando con Prisma
✅ FASE 3 completada: Diseño personalizado con colores Grenoucerie, en español

### LO QUE NECESITO HACER AHORA — FASE 4

**Objetivo**: Construir el microservicio de agentes IA con CrewAI + OpenRouter.

#### Arquitectura que quiero

Un repositorio Python separado (`grenoucerie-agents`) con esta estructura:
```
grenoucerie-agents/
├── main.py                      ← FastAPI — expone endpoints HTTP
├── crews/
│   ├── lead_qualification.py    ← Agente 1: calificación de leads
│   ├── followup_reminder.py     ← Agente 2: seguimiento
│   └── weekly_summary.py        ← Agente 3: resumen semanal
├── tools/
│   ├── crm_database.py          ← Lee/escribe en PostgreSQL del CRM
│   └── email_sender.py          ← Envía emails
├── .env
└── requirements.txt
```

#### Los 3 agentes que necesito

**Agente 1 — Calificación de leads**
- Se activa cuando el CRM llama a `POST /qualify-lead` con los datos del nuevo contacto
- Evalúa si el lead es prometedor según: mercado (España/Francia/Petfood), datos de contacto, historial
- Responde con: puntuación 1-10 + resumen de 2 líneas
- El CRM guarda esa puntuación en el registro del contacto

**Agente 2 — Seguimiento inteligente**
- Se activa cuando el CRM llama a `POST /check-followups`
- Revisa contactos sin actividad en los últimos X días
- Genera sugerencias personalizadas de seguimiento por mercado
- Devuelve lista de recordatorios que el CRM crea automáticamente

**Agente 3 — Resumen semanal**
- Se activa cuando el CRM llama a `GET /weekly-summary`
- Genera informe de actividad de la semana por mercado (España / Francia / Petfood)
- Devuelve el resumen en texto para guardarlo en el CRM y enviarlo por email

#### Variables de entorno a configurar

```env
OPENROUTER_API_KEY="sk-or-..."
OPENAI_API_BASE="https://openrouter.ai/api/v1"
OPENAI_MODEL_NAME="deepseek/deepseek-chat"
DATABASE_URL="postgresql://..."    ← La misma que usa el CRM
```

#### Pasos que necesito

1. Clonar `https://github.com/zloeber/crewai-openrouter-lab` como base
2. Adaptar la estructura al diseño de arriba
3. Implementar los 3 agentes uno por uno
4. Probar cada agente en local
5. Verificar que el CRM puede llamar a los agentes por HTTP

### REGLAS DE TRABAJO

- Siempre en **español**, comentarios en código en español
- Sin tecnicismos — paso a paso
- Los agentes son código nuestro: no dependemos de plataformas externas

Empieza por clonar el repositorio base y mostrarme su estructura actual.

---

### ✂️ FIN DEL PROMPT FASE 4 ✂️

---

---

## FASE 5

### ✂️ COPIA ESTE PROMPT AL ABRIR UN NUEVO CHAT ✂️

---

Hola. Estoy construyendo un CRM para mi empresa y estoy en la última fase: el despliegue. Aquí está todo el contexto:

### MI EMPRESA

Holding empresarial (FEROD) con 3 mercados: España (Grenoucerie), Francia (Grenoucerie FR), Petfood.
No tengo conocimientos técnicos — necesito instrucciones paso a paso.

### MI STACK TÉCNICO

| Componente | Detalle |
|---|---|
| CRM | Fork de BasaltCRM — Next.js 16 + TypeScript + Shadcn/ui + Prisma + PostgreSQL |
| Despliegue CRM | Vercel |
| Microservicio agentes | Python + CrewAI + FastAPI |
| Despliegue agentes | Railway o Render (plan gratuito) |
| LLM | OpenRouter |
| Repositorios | 2 repos en GitHub: `grenoucerie-crm` y `grenoucerie-agents` |

### ESTADO ACTUAL DEL PROYECTO

✅ FASE 1 completada: Repositorio CRM limpio
✅ FASE 2 completada: PostgreSQL con Prisma funcionando
✅ FASE 3 completada: Diseño personalizado con colores Grenoucerie, en español
✅ FASE 4 completada: Microservicio de agentes funcionando en local (3 agentes operativos)

### LO QUE NECESITO HACER AHORA — FASE 5

**Objetivo**: Desplegar todo en producción.

#### Parte A — Despliegue del CRM en Vercel
1. Subir el repositorio `grenoucerie-crm` a GitHub
2. Conectar ese repositorio a Vercel
3. Configurar las variables de entorno en Vercel:
   - `DATABASE_URL` — PostgreSQL en producción
   - URL del microservicio de agentes
4. Hacer el primer deploy y verificar que funciona

#### Parte B — Base de datos PostgreSQL en producción
1. Crear una base de datos PostgreSQL en la nube (Supabase o Neon — plan gratuito)
2. Ejecutar las migraciones de Prisma contra esa base de datos
3. Conectar el CRM y los agentes a esa base de datos

#### Parte C — Despliegue del microservicio de agentes en Railway
1. Subir el repositorio `grenoucerie-agents` a GitHub
2. Conectar ese repositorio a Railway
3. Configurar las variables de entorno en Railway:
   - `OPENROUTER_API_KEY`
   - `DATABASE_URL` — la misma PostgreSQL de producción
4. Hacer el deploy y verificar que los 3 endpoints responden

#### Parte D — Conectar CRM ↔ Agentes en producción
1. Actualizar la URL de los agentes en las variables de entorno del CRM (de localhost a la URL de Railway)
2. Probar que el CRM llama correctamente a los agentes en producción

### REGLAS DE TRABAJO

- Siempre en **español**, sin tecnicismos
- Instrucciones paso a paso como si no sé programar
- Objetivo: todo funcionando en producción con plan gratuito

Empieza por la Parte A: cómo subo el repositorio a GitHub y lo conecto a Vercel.

---

### ✂️ FIN DEL PROMPT FASE 5 ✂️

---

---

## 📝 NOTAS PARA DESPUÉS

### Migración a Anthropic Claude (cuando estés listo)

Solo hay que cambiar 2 variables de entorno en el microservicio de agentes:

```env
# Antes (OpenRouter)
OPENAI_API_BASE="https://openrouter.ai/api/v1"
OPENAI_MODEL_NAME="deepseek/deepseek-chat"

# Después (Anthropic Claude)
OPENAI_API_BASE="https://api.anthropic.com/v1"
OPENAI_MODEL_NAME="claude-opus-4-6"
ANTHROPIC_API_KEY="sk-ant-..."
```

No hay que tocar ninguna línea de código.

### Futura expansión de agentes

Cuando el sistema base funcione, se pueden añadir:
- **Agente de traducción automática** — para comunicaciones con clientes franceses
- **Agente de análisis de mercado** — compara rendimiento España vs Francia vs Petfood
- **Agente de propuestas** — genera borradores de propuestas comerciales

---

*Última actualización: Mayo 2026*
