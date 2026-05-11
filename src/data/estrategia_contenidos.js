// Estrategia de Contenidos y Canales 360 v4.0

// Importamos embudo base
import { embudo } from './grenoucerie'

export const pilaresContenido = [
    {
        id: "salud",
        nombre: "🌿 Salud & Nutrición",
        foco: "0.3g grasa/100g, alta proteína, digestibilidad",
        formatos: ["Infografías comparativas", "Reels rápidos", "Artículos SEO"],
        targets: ["Deportistas", "Dietas", "Tercera edad"],
        ejemplo: "La rana frente al pollo: La comparativa definitiva de macros."
    },
    {
        id: "rentabilidad",
        nombre: "💰 Negocio & Rentabilidad",
        foco: "Margen 60-70%, diferenciación, suministro",
        formatos: ["Casos de éxito CEO", "Posts LinkedIn", "Dossier B2B"],
        targets: ["Chefs", "Propietarios", "Distribuidores"],
        ejemplo: "Por qué la rana es el plato con más margen de tu carta invernal."
    },
    {
        id: "innovacion",
        nombre: "🔪 Innovación Gastronómica",
        foco: "Despieces, nuevas texturas, versatilidad",
        formatos: ["Vídeos receta Chef", "Masterclasses breves"],
        targets: ["Alta cocina", "Foodies", "Cátering"],
        ejemplo: "Piruletas de rana en tempura: reinventando el aperitivo."
    },
    {
        id: "sostenibilidad",
        nombre: "🌍 Trazabilidad & Origen",
        foco: "Cría europea segura, CITES compliance, ecosistema",
        formatos: ["Behind the scenes granja", "Reportajes", "Newsletter"],
        targets: ["B2B Premium", "Consumidor ético"],
        ejemplo: "Del estanque francés a tu plato en 24h: nuestro proceso."
    }
]

export const canalesDistribucion = {
    b2b: [
        { nombre: "LinkedIn CEO", formato: "Insights industria, controversia (elefante en la mesa), rentabilidad B2B", frecuencia: "3x / semana" },
        { nombre: "Newsletter B2B", formato: "Catálogo mensual, casos de éxito, ofertas volumen (Vietnam)", frecuencia: "1x / mes" },
        { nombre: "Outreach (Cold)", formato: "Scripts cortos, foco en objeciones (FAB formula), invitación a demo", frecuencia: "Diario" }
    ],
    b2c: [
        { nombre: "Instagram (Foodporn)", formato: "Alta calidad visual, emplatados, Reels de texturas (#foodporn, #healthy)", frecuencia: "3-4x / semana" },
        { nombre: "TikTok (Educación)", formato: "Curiosidades nutricionales, Behind the scenes rápidos, contrastes locos", frecuencia: "2-3x / semana" },
        { nombre: "Blog (SEO)", formato: "Recetas (intención búsqueda), comparativas carne, dónde comer rana", frecuencia: "1x / semana" }
    ],
    b2b_fr: [
        { nombre: "LinkedIn FR", formato: "La grenouille es de vuelta, cortes innovadores (despieces), calidad AquaPremium", frecuencia: "2x / semana" },
        { nombre: "Direct Email FR", formato: "Catálogo 4 gamas a distribuidores locales", frecuencia: "Semanal (batches)" }
    ]
}

export const hacksCopywriting = [
    { tecnica: "El Elefante en la mesa", aplicacion: "Reconocer que comer rana suena raro y usarlo a favor. 'Sí, son ranas. Y sí, son mejores que tu solomillo.'" },
    { tecnica: "Fórmula FAB (B2B)", aplicacion: "Característica: Calibre premium. Ventaja: Ración controlada. Beneficio: Escandallo perfecto y margen 70% asegurado." },
    { tecnica: "Contraste Inesperado", aplicacion: "Unir conceptos opuestos: 'La proteína del culturista que aman los chefs Míchelin.'" },
    { tecnica: "FAQ Anti-Fricción", aplicacion: "Resolver objeciones antes de la compra: '¿A qué sabe?', '¿Es legal?', '¿Cómo se limpia?'." }
]
