// Datos del Stack Tecnológico y Arquitectura Agéntica v2.0
// Basado en Arquitectura_Agentica_RevOps_v1.0.md + agentes_mejorado.md + skill orquestador_revops

// === STACK POR FASE (costeado y secuenciado) ===
export const stackPorFase = [
    {
        fase: "F1 — Cimientos (Mes 1-3)",
        costeRango: "<€100/mes",
        color: "var(--pistacho)",
        capas: [
            {
                capa: "📦 Datos y CDP",
                tools: [
                    { nombre: "HubSpot CRM Free", funcion: "Pipeline multi-gama 6 fases", coste: "€0", estado: "activar", prioridad: "CRÍTICA" },
                    { nombre: "Supabase", funcion: "Base datos PostgreSQL + pgvector (RAG)", coste: "€0 (free tier)", estado: "activar", prioridad: "CRÍTICA" },
                    { nombre: "Google BigQuery", funcion: "Data warehouse analítico (10GB gratis/mes)", coste: "€0", estado: "futuro", prioridad: "Alta" },
                ]
            },
            {
                capa: "🔗 Integraciones",
                tools: [
                    { nombre: "n8n Cloud", funcion: "Orquestador iPaaS central (todos los flujos)", coste: "€20/mes", estado: "activar", prioridad: "CRÍTICA" },
                    { nombre: "Brevo Free", funcion: "Email transaccional + nurturing (300/día)", coste: "€0", estado: "activar", prioridad: "CRÍTICA" },
                ]
            },
            {
                capa: "📊 Analítica",
                tools: [
                    { nombre: "Google Analytics 4", funcion: "Eventos custom web + atribución", coste: "€0", estado: "activar", prioridad: "CRÍTICA" },
                    { nombre: "Google Search Console", funcion: "SEO + keywords categoría rana", coste: "€0", estado: "activar", prioridad: "Alta" },
                    { nombre: "Metabase", funcion: "Dashboard unificado (conecta con Supabase)", coste: "€0 (open source)", estado: "futuro", prioridad: "Alta" },
                ]
            },
            {
                capa: "🤖 Agentes IA (Human-in-the-Loop)",
                tools: [
                    { nombre: "Claude API", funcion: "Motor LLM para agentes de prospección y scoring", coste: "€30-80/mes", estado: "activo", prioridad: "CRÍTICA" },
                    { nombre: "LinkedIn Sales Navigator", funcion: "Prospección multi-gama B2B", coste: "€80/mes", estado: "pendiente", prioridad: "CRÍTICA" },
                ]
            }
        ]
    },
    {
        fase: "F2 — Crecimiento (Mes 4-6)",
        costeRango: "+€50-100/mes",
        color: "var(--oliva-light)",
        capas: [
            {
                capa: "🤖 Agentes Autónomos",
                tools: [
                    { nombre: "CrewAI", funcion: "Orquestador multi-agente (Nurturing + Reporting)", coste: "€0 (open source)", estado: "futuro", prioridad: "Alta" },
                    { nombre: "LangChain + pgvector", funcion: "RAG sobre M1-M6 + historial CRM", coste: "€0", estado: "futuro", prioridad: "Alta" },
                ]
            },
            {
                capa: "📢 Canales Expansión",
                tools: [
                    { nombre: "Chatbot Web (n8n + Claude)", funcion: "Atención visitantes B2B+B2C en tiempo real", coste: "Incluido en Claude API", estado: "futuro", prioridad: "Alta" },
                    { nombre: "WhatsApp Business API", funcion: "Canal directo con chefs (prefieren WA)", coste: "€0-15/mes", estado: "futuro", prioridad: "Media" },
                    { nombre: "GrowthBook", funcion: "A/B testing emails y landing pages", coste: "€0 (open source)", estado: "futuro", prioridad: "Media" },
                ]
            }
        ]
    },
    {
        fase: "F3 — Escala (Mes 7-12)",
        costeRango: "+€50-100/mes",
        color: "var(--text-muted)",
        capas: [
            {
                capa: "🧠 IA Avanzada",
                tools: [
                    { nombre: "Scoring ML (scikit-learn)", funcion: "Lead scoring predictivo con datos reales (>100 leads)", coste: "€0", estado: "futuro", prioridad: "Alta" },
                    { nombre: "RAG Contextual (Chroma/pgvector)", funcion: "Objeciones con historial conversacional vectorizado", coste: "€0", estado: "futuro", prioridad: "Media" },
                ]
            },
            {
                capa: "💰 Paid & Atribución",
                tools: [
                    { nombre: "Google Ads + Meta", funcion: "Campañas paid con atribución vía n8n → BigQuery", coste: "Variable (presupuesto)", estado: "futuro", prioridad: "Media" },
                    { nombre: "Semrush Lite", funcion: "SEO competitivo + trends categoría rana", coste: "€50-100/mes", estado: "futuro", prioridad: "Media" },
                ]
            }
        ]
    }
]

// === 6 AGENTES PRIORITARIOS ===
export const agentesPrioritarios = [
    {
        id: 1,
        nombre: "Prospección ICP",
        emoji: "🔍",
        fusiona: "AG-002 + AG-014",
        descripcion: "Identifica y enriquece leads B2B con perfil ICP match",
        stack: "n8n + Claude + LinkedIn Sales Nav",
        fase: "F1 — Mes 2",
        kpiPrimario: "Leads ICP-match/semana",
        umbralMinimo: "5/sem, >60% aceptados",
        umbralOptimo: "15/sem, >80% aceptados",
        modo: "Human-in-the-loop",
        color: "#93C572"
    },
    {
        id: 2,
        nombre: "Scoring Heurístico",
        emoji: "📊",
        fusiona: "AG-007 (módulo scoring)",
        descripcion: "Clasifica leads A/B/C con reglas de 100 puntos (Cargo+Empresa+Comportamiento+Timing)",
        stack: "n8n + reglas heurísticas",
        fase: "F1 — Mes 2",
        kpiPrimario: "Correlación score↔conversión",
        umbralMinimo: "r>0.5",
        umbralOptimo: "r>0.75, scoring <1h",
        modo: "Human-in-the-loop",
        color: "#BAB86C"
    },
    {
        id: 3,
        nombre: "Seguimiento Comercial",
        emoji: "🔔",
        fusiona: "AG-007 + AG-001",
        descripcion: "Alerta si lead >72h sin actividad y genera draft de email con M3 Playbook",
        stack: "n8n + Claude + HubSpot Tasks + RAG",
        fase: "F1 — Mes 3",
        kpiPrimario: "Cobertura leads >72h sin actividad",
        umbralMinimo: "90% cobertura",
        umbralOptimo: "100%, >25% re-engagement",
        modo: "Human-in-the-loop",
        color: "#9DC183"
    },
    {
        id: 4,
        nombre: "Nurturing Hiperpersonalizado",
        emoji: "💌",
        fusiona: "AG-005 + AG-008",
        descripcion: "Emails segmentados por tier + gama con tono M6 y contexto RAG de M1-M6",
        stack: "CrewAI + Claude + Brevo API",
        fase: "F2 — Mes 4",
        kpiPrimario: "Open rate emails generados",
        umbralMinimo: "OR>30%, CTR>5%",
        umbralOptimo: "OR>40%, CTR>10%",
        modo: "Autonomía progresiva",
        color: "#6b8a5e"
    },
    {
        id: 5,
        nombre: "Optimización Campañas",
        emoji: "📈",
        fusiona: "AG-009 + AG-004",
        descripcion: "Cruza datos de rendimiento con redistribución de presupuesto por canal",
        stack: "n8n + Python + BigQuery",
        fase: "F2 — Mes 5",
        kpiPrimario: "CAC por canal",
        umbralMinimo: "<€50/MQL",
        umbralOptimo: "<€25/MQL, ROI>400%",
        modo: "Autonomía progresiva",
        color: "#808000"
    },
    {
        id: 6,
        nombre: "Reporting Narrativo",
        emoji: "📋",
        fusiona: "AG-009 + AG-001",
        descripcion: "Resumen semanal automático en lenguaje natural → Telegram cada lunes 8:00",
        stack: "CrewAI + Claude + Metabase API + Telegram",
        fase: "F2 — Mes 4",
        kpiPrimario: "Insights accionados por equipo",
        umbralMinimo: ">50% leídos",
        umbralOptimo: ">80% accionados",
        modo: "Autonomía progresiva",
        color: "#4caf50"
    }
]

// === PRESUPUESTO COMPARATIVO ===
export const presupuestoComparativo = [
    { concepto: "CRM", sistema15: "HubSpot Pro (€800/mes)", propuesta: "HubSpot Free (€0)", ahorro: "100%" },
    { concepto: "Email", sistema15: "ActiveCampaign (€150/mes)", propuesta: "Brevo Free (€0)", ahorro: "100%" },
    { concepto: "Orquestación", sistema15: "Make.com + Zapier (€100/mes)", propuesta: "n8n Cloud (€20/mes)", ahorro: "80%" },
    { concepto: "Social Listening", sistema15: "Brandwatch (€1.000/mes)", propuesta: "Google Alerts + n8n (€0)", ahorro: "100%" },
    { concepto: "Analytics", sistema15: "Power BI Pro (€10/user)", propuesta: "Metabase open source (€0)", ahorro: "100%" },
    { concepto: "LLM", sistema15: "Claude API", propuesta: "Claude API (€30-80/mes)", ahorro: "=" },
    { concepto: "LinkedIn", sistema15: "Sales Navigator (€80/mes)", propuesta: "Sales Navigator (€80/mes)", ahorro: "=" },
]

// === ROADMAP TRIMESTRAL ===
export const roadmapAgentes = [
    {
        quarter: "Q1 (Mes 1-3)",
        titulo: "Los Cimientos",
        color: "var(--pistacho)",
        hitos: [
            { hito: "CRM operativo con pipeline 6 fases", fecha: "Mes 1", metrica: "≥30 leads con campos completos" },
            { hito: "n8n: 3 workflows activos (web→CRM, alerta 72h, bienvenida)", fecha: "Mes 1", metrica: "100% leads procesados automáticamente" },
            { hito: "Agente Prospección v1: 10 leads ICP/semana", fecha: "Mes 2", metrica: "10 leads/semana enriquecidos" },
            { hito: "Agente Scoring: leads clasificados A/B/C", fecha: "Mes 2", metrica: "100% leads con score <24h" },
            { hito: "Dashboard Metabase con métricas clave", fecha: "Mes 3", metrica: "1 dashboard: leads, pipeline, conversión" },
        ]
    },
    {
        quarter: "Q2 (Mes 4-6)",
        titulo: "Los Agentes Despiertan",
        color: "var(--oliva-light)",
        hitos: [
            { hito: "Agente Nurturing v1 — emails personalizados", fecha: "Mes 4", metrica: "Open rate >35%" },
            { hito: "Agente Reporting v1 — resumen semanal auto", fecha: "Mes 4", metrica: "Resumen Telegram cada lunes 8:00" },
            { hito: "Agente Campañas v1 — redistribución sugerida", fecha: "Mes 5", metrica: "1 recomendación semanal con datos" },
            { hito: "Chatbot web operativo", fecha: "Mes 5", metrica: ">50 conversaciones/mes" },
            { hito: "50 leads B2B en pipeline activo", fecha: "Mes 6", metrica: "≥8 en Negociación/Activo" },
        ]
    },
    {
        quarter: "Q3 (Mes 7-9)",
        titulo: "Autonomía",
        color: "var(--salvia)",
        hitos: [
            { hito: "Scoring ML con datos reales", fecha: "Mes 7", metrica: "Accuracy >80%" },
            { hito: "RAG sobre historial de interacciones", fecha: "Mes 8", metrica: "Objeciones con contexto conversacional" },
            { hito: "WhatsApp Business integrado", fecha: "Mes 8", metrica: ">20 conversaciones B2B/mes" },
            { hito: "Paid con atribución completa", fecha: "Mes 9", metrica: "CAC por canal medible" },
        ]
    },
    {
        quarter: "Q4 (Mes 10-12)",
        titulo: "Escala",
        color: "var(--oliva)",
        hitos: [
            { hito: "CrewAI orquestando 6 agentes", fecha: "Mes 10", metrica: "<10% intervención humana en rutinas" },
            { hito: "Revenue por agentes: >€50K pipeline", fecha: "Mes 11", metrica: "Pipeline generado/gestionado ≥€50K" },
            { hito: "Francia con pipeline propio", fecha: "Mes 12", metrica: "≥15 leads FR, ≥3 clientes FR activos" },
        ]
    }
]

// === RIESGOS ===
export const riesgosStack = [
    {
        nombre: "Síndrome de la Herramienta Vacía",
        probabilidad: "🔴 Alta",
        descripcion: "Desplegar agentes sofisticados sin datos reales",
        mitigacion: "Mes 1-3: solo reglas heurísticas. Requisito: >100 leads antes de ML. Human-in-the-loop hasta accuracy >80%."
    },
    {
        nombre: "Fatiga de Integración",
        probabilidad: "🟡 Media-Alta",
        descripcion: "2 personas intentan conectar 12 herramientas a la vez",
        mitigacion: "Regla 3-3-3: máximo 3 tools nuevas por trimestre. n8n como hub único para toda integración."
    },
    {
        nombre: "Agentes sin Voz de Marca",
        probabilidad: "🟡 Media",
        descripcion: "Los agentes generan copy genérico ignorando el tono M6",
        mitigacion: "System prompt unificado con tono M6. RAG sobre M1-M6 vectorizados. Review humano en F1 para todo texto generado."
    }
]
