// Datos maestros del Ecosistema Marketing & Ventas — Grenoucerie S.L.
// VERSIÓN 3.0 — Corrección estratégica: monoproducto 4 gamas, embudo de categoría

export const empresa = {
    nombre: "Grenoucerie S.L.",
    ceo: "Fabián Simón",
    fecha: "4 Marzo 2026",
    dia_objetivo: 90,
    mensajeCentral: "La carne más saludable del mundo",
};

// === 4 GAMAS DE PRODUCTO ===
export const gamas = [
    {
        id: "vietnam",
        nombre: "Vietnam",
        emoji: "🇻🇳",
        tipo: "Gama Baja — Volumen",
        ratio: "10 kg",
        descripcion: "Ancas congeladas importadas de Vietnam",
        cliente: "Distribuidores mayoristas + cadenas congelados",
        argumento: "Precio competitivo, volumen garantizado, proveedor único para toda la cadena",
        color: "#6b8a5e",
    },
    {
        id: "premium",
        nombre: "Premium",
        emoji: "⭐",
        tipo: "Gama Alta — Congelada seleccionada",
        ratio: "1 kg",
        descripcion: "Ancas congeladas premium, mejor calibre y origen",
        cliente: "Distribuidores gourmet + restaurantes directos",
        argumento: "Calibre superior, diferenciación en carta, margen 60-70% para el chef",
        color: "#93C572",
    },
    {
        id: "club",
        nombre: "Club / Fresca",
        emoji: "👑",
        tipo: "Gama Extra — Producción propia",
        ratio: "0.1 kg",
        descripcion: "Ancas frescas de granja europea (ES/FR)",
        cliente: "Restaurantes top gastronómicos, venta directa CEO",
        argumento: "Fresca, Km0, trazabilidad estanque-plato, exclusividad, historia del productor",
        color: "#BAB86C",
    },
    {
        id: "despieces",
        nombre: "Despieces",
        emoji: "🔪",
        tipo: "INNOVACIÓN — No existe en el mercado",
        ratio: "Nuevo",
        descripcion: "Cortes nuevos de rana que nadie más ofrece",
        cliente: "TODOS los canales — transversal",
        argumento: "Producto sin competencia, abre nuevas formas de cocinar rana, versatilidad total",
        color: "#9DC183",
    },
];

// === KPIs v3.0 ===
export const kpis = [
    {
        id: 1,
        categoria: "Revenue",
        label: "Facturación mensual",
        valor: "€60K",
        baseline: "€31.6K",
        meta90: "€65K",
        meta12m: "€75-85K",
        semaforo: "verde",
        tendencia: "+87%",
        progreso: 88,
    },
    {
        id: 2,
        categoria: "Pipeline",
        label: "Leads B2B total (4 gamas)",
        valor: "0",
        baseline: "0",
        meta90: "50+",
        meta12m: "200+",
        semaforo: "rojo",
        tendencia: "—",
        progreso: 0,
    },
    {
        id: 3,
        categoria: "Vietnam",
        label: "Leads Vietnam (distrib.)",
        valor: "0",
        baseline: "0",
        meta90: "10+",
        meta12m: "30+",
        semaforo: "rojo",
        tendencia: "—",
        progreso: 0,
    },
    {
        id: 4,
        categoria: "Premium",
        label: "Leads Premium (distrib+rest)",
        valor: "0",
        baseline: "0",
        meta90: "15+",
        meta12m: "60+",
        semaforo: "rojo",
        tendencia: "—",
        progreso: 0,
    },
    {
        id: 5,
        categoria: "Despieces",
        label: "Leads Despieces",
        valor: "0",
        baseline: "0",
        meta90: "5+",
        meta12m: "20+",
        semaforo: "rojo",
        tendencia: "Nuevo",
        progreso: 0,
    },
    {
        id: 6,
        categoria: "Categoría",
        label: 'Búsq. Google "ancas de rana"',
        valor: "—",
        baseline: "—",
        meta90: "+20%",
        meta12m: "+100%",
        semaforo: "neutro",
        tendencia: "Baseline pendiente",
        progreso: 0,
    },
    {
        id: 7,
        categoria: "Marketing",
        label: "Tráfico web/mes",
        valor: "~500",
        baseline: "~500",
        meta90: "1.500",
        meta12m: "5.000",
        semaforo: "amarillo",
        tendencia: "—",
        progreso: 10,
    },
    {
        id: 8,
        categoria: "Marketing",
        label: "Impresiones LinkedIn/mes",
        valor: "0",
        baseline: "0",
        meta90: "10.000",
        meta12m: "50.000",
        semaforo: "rojo",
        tendencia: "—",
        progreso: 0,
    },
    {
        id: 9,
        categoria: "B2C",
        label: "Vídeos recetas publicados",
        valor: "0",
        baseline: "0",
        meta90: "6+",
        meta12m: "30+",
        semaforo: "rojo",
        tendencia: "—",
        progreso: 0,
    },
    {
        id: 10,
        categoria: "Francia",
        label: "Distribuidores FR activos",
        valor: "0",
        baseline: "0",
        meta90: "0",
        meta12m: "2-3",
        semaforo: "neutro",
        tendencia: "Mes 5-6",
        progreso: 0,
    },
];

// === PIPELINE MULTI-GAMA ===
export const pipelineColumnas = [
    {
        id: "prospeccion",
        nombre: "Prospección",
        descripcion: "Identificar targets multi-gama",
        color: "#6b8a5e",
        cards: [],
    },
    {
        id: "contacto",
        nombre: "Contacto",
        descripcion: "Outreach por gama",
        color: "#93C572",
        cards: [],
    },
    {
        id: "muestra",
        nombre: "Muestra / Demo",
        descripcion: "Kit muestra o reunión comercial",
        color: "#BAB86C",
        cards: [],
    },
    {
        id: "negociacion",
        nombre: "Negociación",
        descripcion: "Propuesta comercial enviada",
        color: "#9DC183",
        cards: [],
    },
    {
        id: "activo",
        nombre: "Cliente Activo",
        descripcion: "Primer pedido realizado",
        color: "#4caf50",
        cards: [
            { id: "c1", nombre: "Distrib. Mayorista Madrid", tipo: "Vietnam", mercado: "ES", valor: "Volumen" },
            { id: "c2", nombre: "Rest. 1 Sol Repsol BCN", tipo: "Premium", mercado: "ES", valor: "Premium" },
        ],
    },
    {
        id: "embajador",
        nombre: "Embajador",
        descripcion: "Referidor activo multi-gama",
        color: "#93C572",
        cards: [],
    },
];

// === EMBUDO DE CATEGORÍA ===
export const embudo = {
    tofu: {
        nombre: "TOFU — Que Suene la Rana",
        mensaje: "¿Conoces la carne más saludable del mundo?",
        target: "TODOS — hosteleros, consumidores, amas de casa, foodies, salud",
        regla: "CERO marca, CERO gama. Solo RANA como categoría.",
        canales: ["Instagram", "TikTok", "LinkedIn", "Prensa food", "Influencers"],
        kpi: 'Búsquedas Google "ancas de rana" ↑',
        ejemplos: [
            "¿Sabías que la rana tiene 0.3g de grasa por cada 100g? El pollo tiene 12 veces más.",
            "Europa consume 3.800 toneladas de rana al año. ¿Cuántas has probado tú?",
            "La rana se come en Francia, España, China, Indonesia, Perú, EEUU... ¿Y tú?",
            "¿Qué carne no te da sueño, tiene menos grasa que la pechuga y está en 50+ cocinas?",
        ],
    },
    mofu: {
        nombre: "MOFU — Educación + Deseo",
        mensaje: "La rana está en todas las cocinas del mundo. Descubre por qué.",
        targets: [
            {
                icono: "👨‍🍳",
                nombre: "Hostelero",
                necesita: "Margen 60-70%, diferenciación de carta, tendencia, temporada todo el año",
            },
            {
                icono: "🍽️",
                nombre: "Consumidor Final",
                necesita: "Experiencia, salud, cultura, gourmet, pedirla en restaurante",
            },
            {
                icono: "🏠",
                nombre: "Ama de Casa",
                necesita: "Recetas fáciles en 20 min, dónde comprar, tradición familiar",
            },
            {
                icono: "🏥",
                nombre: "Persona Salud",
                necesita: "Baja grasa, baja sal, no da sueño, deportistas, dietas, mayores",
            },
        ],
        regla: "Grenoucerie aparece como EXPERTO, pero NO se empuja compra directa",
        canales: ["Blog/Grenoupedia", "YouTube recetas", "Instagram", "Newsletter", "Ferias"],
        kpi: "Tiempo en web ↑, suscriptores email ↑, recetas compartidas ↑",
    },
    bofu: {
        nombre: "BOFU — Diferenciación por Gama",
        mensaje: "Ya conoces la rana. Ahora elige cuál.",
        regla: "AQUÍ sí se vende. Diferenciación por cada gama.",
        kpi: "Conversión lead→cliente por gama, valor medio pedido, reposición",
    },
};

// === NUTRICIÓN COMPARATIVA (soporte del claim "más saludable") ===
export const nutricion = [
    { carne: "Rana", calorias: 73, grasa: 0.3, proteina: 16.4, colesterol: "Bajo", sodio: "Muy bajo", sueno: "No" },
    { carne: "Pollo", calorias: 165, grasa: 3.6, proteina: 31, colesterol: "Medio", sodio: "Bajo", sueno: "Sí" },
    { carne: "Ternera", calorias: 250, grasa: 15, proteina: 26, colesterol: "Alto", sodio: "Medio", sueno: "Sí" },
    { carne: "Cerdo", calorias: 242, grasa: 14, proteina: 27, colesterol: "Alto", sodio: "Medio", sueno: "Sí" },
    { carne: "Salmón", calorias: 208, grasa: 13, proteina: 20, colesterol: "Medio", sodio: "Bajo", sueno: "No" },
];

// === CALENDARIO EDITORIAL v3.0 ===
export const calendarioEditorial = [
    {
        semana: "Semana 1",
        contenidos: [
            { canal: "Instagram", texto: "TOFU: ¿Sabías que la rana tiene 0.3g de grasa? Infografía nutricional", tipo: "TOFU" },
            { canal: "LinkedIn", texto: "MOFU Hostelero: Por qué la rana te da 60-70% de margen en carta", tipo: "MOFU" },
            { canal: "TikTok", texto: "TOFU: 'La carne más saludable del mundo en 30 segundos'", tipo: "TOFU" },
        ],
    },
    {
        semana: "Semana 2",
        contenidos: [
            { canal: "YouTube", texto: "MOFU Ama de casa: Ancas al ajillo fácil en 15 minutos", tipo: "MOFU" },
            { canal: "LinkedIn", texto: "MOFU Hostelero: Chef [nombre] cuenta por qué la rana no sale de su carta", tipo: "MOFU" },
            { canal: "Blog SEO", texto: "MOFU Salud: Rana vs pollo vs ternera — la comparativa que no esperabas", tipo: "MOFU" },
            { canal: "Instagram", texto: "TOFU: 'Europa consume 3.800 t/año. ¿Tú la has probado?'", tipo: "TOFU" },
        ],
    },
    {
        semana: "Semana 3",
        contenidos: [
            { canal: "LinkedIn", texto: "MOFU: Dato de mercado: la rana se come en 50+ países", tipo: "MOFU" },
            { canal: "Instagram", texto: "MOFU: Receta visual rápida — tapa de rana en 3 pasos", tipo: "MOFU" },
            { canal: "Email B2B", texto: "Newsletter multi-gama: Vietnam stock + Premium novedad + Despieces coming", tipo: "BOFU" },
        ],
    },
    {
        semana: "Semana 4",
        contenidos: [
            { canal: "YouTube", texto: "MOFU: Receta para personas con dieta baja en grasa", tipo: "MOFU" },
            { canal: "LinkedIn", texto: "TOFU: Reflexión CEO — '11 años criando ranas, esto es lo que aprendí'", tipo: "TOFU" },
            { canal: "Blog SEO", texto: "MOFU: 'Dónde comprar ancas de rana en España — guía completa'", tipo: "MOFU" },
            { canal: "LinkedIn FR", texto: "MOFU FR: 'Des découpes inédites — la grenouille comme jamais vue'", tipo: "MOFU" },
        ],
    },
];

// === STACK TECNOLÓGICO (sin cambio relevante) ===
export const stackTecnologico = [
    {
        categoria: "Semana 1-2 (€20-30/mes)",
        tools: [
            { nombre: "HubSpot CRM Free", funcion: "Pipeline multi-gama", coste: "€0", estado: "activar", prioridad: "CRÍTICA" },
            { nombre: "Google Analytics 4", funcion: "Tráfico web", coste: "€0", estado: "activar", prioridad: "Alta" },
            { nombre: "Google Search Console", funcion: "SEO + keywords categoría", coste: "€0", estado: "activar", prioridad: "Alta" },
            { nombre: "Notion Free", funcion: "Roadmap + calendario editorial", coste: "€0", estado: "activar", prioridad: "Alta" },
            { nombre: "Claude Pro", funcion: "Redacción + análisis", coste: "€20/mes", estado: "activo", prioridad: "Alta" },
            { nombre: "Canva Free", funcion: "Infografías + RRSS", coste: "€0", estado: "activar", prioridad: "Media" },
        ],
    },
    {
        categoria: "Mes 1-2 (€80-150/mes)",
        tools: [
            { nombre: "LinkedIn Sales Nav.", funcion: "Prospección multi-gama", coste: "€80/mes", estado: "pendiente", prioridad: "CRÍTICA" },
            { nombre: "Brevo Starter", funcion: "Email marketing", coste: "€0-25/mes", estado: "pendiente", prioridad: "Alta" },
            { nombre: "Buffer Free", funcion: "Programación RRSS multi-canal", coste: "€0", estado: "pendiente", prioridad: "Media" },
        ],
    },
    {
        categoria: "Mes 3-6 (€100-200/mes)",
        tools: [
            { nombre: "Semrush Lite", funcion: "SEO categoría + trends rana", coste: "€50-100/mes", estado: "futuro", prioridad: "Media" },
            { nombre: "Canva Pro", funcion: "Creatividades avanzadas", coste: "€12/mes", estado: "futuro", prioridad: "Media" },
            { nombre: "Capcut / InShot", funcion: "Edición vídeo recetas", coste: "€0-10/mes", estado: "futuro", prioridad: "Alta" },
        ],
    },
];

// === ROADMAP 90 DÍAS v3.0 ===
export const roadmap90Dias = [
    { semana: 1, accion: "CRM multi-gama configurado. Primer post TOFU: '¿Conoces la carne más saludable del mundo?'", meta: "CRM live + 1 post TOFU", criterio: ">10 contactos cargados (mezcla Vietnam+Premium)" },
    { semana: 2, accion: "Lista 50 targets multi-gama: 20 distrib. Vietnam + 20 Premium + 10 restaurantes. LinkedIn activo.", meta: "Lista + 5 conexiones", criterio: ">3 conexiones aceptadas" },
    { semana: 3, accion: "Narrativa categoría: 'la carne más saludable'. Tabla nutricional validada. Primer vídeo receta.", meta: "Narrativa + tabla + vídeo", criterio: "Tabla nutricional publicada en web" },
    { semana: 4, accion: "Blog SEO salud: comparativa rana vs carnes. Email template multi-gama. 15 leads en CRM.", meta: "Artículo + template + 15 leads", criterio: "Artículo publicado" },
    { semana: 5, accion: "Muestras: 3 Premium + 2 Despieces (si disponibles). Segundo vídeo receta (ama de casa).", meta: "5 muestras + vídeo", criterio: "Muestras enviadas" },
    { semana: 6, accion: "Follow-up muestras. Tercer vídeo receta rápida. Contenido despieces: 'cortes nunca vistos'.", meta: "Follow-ups + vídeo + despieces", criterio: ">2 respuestas positivas muestras" },
    { semana: 7, accion: "Francia: LinkedIn FR + investigación 30 distribuidores FR. Contenido MOFU formatos nuevos.", meta: "2 posts FR + lista 30 targets", criterio: "Posts publicados en FR" },
    { semana: 8, accion: "Revisión pipeline multi-gama. Ajustar secuencia por gama. Cuarto vídeo receta.", meta: "Dashboard actualizado", criterio: ">30 leads CRM, >5 en muestra" },
    { semana: 9, accion: "Cerrar 2-3 pedidos nuevos (mezcla Vietnam mayorista + Premium restaurante).", meta: "Pedidos multi-gama", criterio: ">2 nuevos clientes" },
    { semana: 10, accion: "Deck grupo: categoría 'la más saludable' + 4 gamas + pipeline + Francia.", meta: "Deck borrador", criterio: "Deck 15-20 slides" },
    { semana: 11, accion: "Consolidar datos + ajustar presupuesto por gama según tracción real.", meta: "Deck final + data pack", criterio: "Datos consolidados" },
    { semana: 12, accion: "PRESENTACIÓN AL GRUPO: embudo categoría + 4 gamas + pipeline operativo + plan 12m.", meta: "Presentación + dashboard", criterio: "Aprobación del grupo" },
];

// === DATOS FRANCIA v3.0 ===
export const franciaData = {
    narrativa: "La grenouille revient chez elle. Élevée en France par AquaPremium. Des découpes inédites que vous n'avez jamais vues.",
    diferencia: "Francia YA consume rana. No necesita TOFU de categoría. Necesita MOFU sobre gamas NUEVAS + BOFU conversión.",
    tamano: "x20 España",
    aquapremium: {
        rol: "Infraestructura productiva en Francia (sin clientes propios)",
        aporte: "Instalaciones FR + marca registrada + presencia geográfica",
        estado: "Activo — 0 ventas históricas",
    },
    oportunidades: [
        "Premium congelada: NO existe posicionada en FR → oportunidad",
        "Despieces: NO existen en el mercado FR → innovación pura",
        "Producción local: AquaPremium = 'producido en Francia' → argumento patriótico",
    ],
    targets: [],
    presupuesto90: "€3.000-5.000",
    hitos: [
        { semana: "1-2", accion: "Investigar Top 50 distribuidores FR + 30 restaurantes grenouille" },
        { semana: "2-3", accion: "LinkedIn FR activo: 2 posts/sem sobre premium + despieces innovadores" },
        { semana: "3-4", accion: "10 distribuidores FR contactados con catálogo completo (4 gamas)" },
        { semana: "4-5", accion: "Kit muestras premium + despieces a 5 distribuidores seleccionados" },
        { semana: "5-6", accion: "Cerrar 1-2 distribuidores FR con primer pedido" },
    ],
};

// === PROMPT MAESTRO v4.0 ===
export const promptMaestro = `## IDENTIDAD

Triple perspectiva: CEO + CMO + COO con dominios explícitos.
Cuando colisionan → "⚔️ CONFLICTO: CEO priorizaría X... CMO Y... Recomiendo Z porque..."

## CONTEXTO CRÍTICO

Grenoucerie = MONOPRODUCTO (ancas de rana), 4 GAMAS:
- Vietnam (volumen, ratio 10x) → distribuidores mayoristas + cadenas congelados
- Premium (calidad, ratio 1x) → distribuidores gourmet + restaurantes directos
- Club/Fresca (exclusividad, ratio 0.1x) → restaurantes top, venta directa CEO
- Despieces (innovación, NUEVO) → TODOS los canales, NO EXISTE en mercado

EMBUDO = DE CATEGORÍA, no de marca:
- TOFU: "Que suene la rana" — visibilidad categoría, 0 marca, 0 gama
- MOFU: Educación segmentada (hostelero, consumidor, ama de casa, salud)
- BOFU: Diferenciación por gama

MENSAJE CENTRAL: "La carne más saludable del mundo"
- 0.3g grasa/100g (vs 3.6g pollo, 15g ternera)
- No da sueño, baja sal, proteína completa

OBJETIVO: GENERAR MERCADO NUEVO (no competir por existente)
- Hostelero que mete rana en carta
- Consumidor que la pide
- Ama de casa que la cocina
- Persona salud que la necesita

FRANCIA = mercado existente x20, penetrar con formatos nuevos
(premium congelada + despieces). AquaPremium como Caballo de Troya.

DATOS: €379K facturación, +87% momentum, 99% trading Vietnam,
€100K presupuesto marketing, equipo = Fabián + IA.

## RESTRICCIONES

1. Presupuesto escaso = priorización brutal
2. Multi-gama pero B2B primero
3. IA-first — automatización sobre headcount
4. Francia ≠ España (penetrar, no crear)
5. Category creation antes de demand capture
6. Cada euro → pipeline o generación de categoría

## FORMATO RESPUESTA

1. DECISIÓN O ENTREGABLE
2. SUPUESTOS ASUMIDOS
3. RIESGO + mitigación
4. PRÓXIMA ACCIÓN`;
