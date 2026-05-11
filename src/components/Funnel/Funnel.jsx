// Funnel TOFU → MOFU → BOFU — Vista completa CMO
import { useState } from 'react'
import { embudo, kpis, calendarioEditorial } from '../../data/grenoucerie'

const funnelLevels = [
    {
        id: 'tofu', label: 'TOFU', title: 'Que Suene la Rana',
        color: '#6b8a5e', bg: 'rgba(107,138,94,0.12)',
        emoji: '📣',
        mensaje: embudo.tofu.mensaje,
        regla: embudo.tofu.regla,
        target: embudo.tofu.target,
        canales: embudo.tofu.canales,
        kpi: embudo.tofu.kpi,
        metrica: '0',
        meta: '10K búsquedas/mes',
        ejemplos: embudo.tofu.ejemplos,
        ancho: 100,
    },
    {
        id: 'mofu', label: 'MOFU', title: 'Educación + Deseo',
        color: '#93C572', bg: 'rgba(147,197,114,0.12)',
        emoji: '🎓',
        mensaje: embudo.mofu.mensaje,
        regla: embudo.mofu.regla,
        target: embudo.mofu.targets?.map(t => `${t.icono} ${t.nombre}`).join(' · ') || '',
        canales: embudo.mofu.canales,
        kpi: embudo.mofu.kpi,
        metrica: '~500',
        meta: '1.500 visitas/mes',
        ejemplos: embudo.mofu.targets?.map(t => `${t.icono} ${t.nombre}: ${t.necesita}`) || [],
        ancho: 73,
    },
    {
        id: 'bofu', label: 'BOFU', title: 'Diferenciación por Gama',
        color: '#BAB86C', bg: 'rgba(186,184,108,0.12)',
        emoji: '🎯',
        mensaje: embudo.bofu.mensaje,
        regla: embudo.bofu.regla,
        target: 'Leads cualificados → 4 gamas',
        canales: ['LinkedIn Sales Nav.', 'Email B2B', 'WhatsApp', 'Reunión directa'],
        kpi: embudo.bofu.kpi,
        metrica: '0',
        meta: '50+ leads 90d',
        ejemplos: [
            'Vietnam: Propuesta volumen para distribuidor mayorista',
            'Premium: Muestra degustación + margen 60-70%',
            'Club/Fresca: Reunión directa CEO con chef top',
            'Despieces: "Cortes que nadie más tiene" — exclusividad',
        ],
        ancho: 47,
    },
    {
        id: 'pipeline', label: 'PIPELINE', title: 'Conversión B2B 6 Fases',
        color: '#4caf50', bg: 'rgba(76,175,80,0.12)',
        emoji: '⚙️',
        mensaje: 'Prospección → Contacto → Muestra → Negociación → Activo → Embajador',
        regla: 'Cada lead entra segmentado por gama y mercado',
        target: 'Hosteleros, distribuidores, grupos horeca',
        canales: ['HubSpot CRM', 'LinkedIn', 'Email', 'WhatsApp Business'],
        kpi: 'Tasa conversión por gama · Valor medio pedido · Tiempo de ciclo',
        metrica: '2',
        meta: '15+ clientes activos',
        ejemplos: [
            '🔍 Prospección: target identificado, sin contacto',
            '📞 Contacto: primer touch enviado',
            '📦 Muestra: kit enviado o cita concertada',
            '🤝 Negociación: propuesta comercial enviada',
            '✅ Activo: primer pedido realizado',
            '⭐ Embajador: referidor activo multi-gama',
        ],
        ancho: 27,
    },
]

// Canal → Funnel stage mapping
const canalFunnel = [
    { canal: 'TikTok',          funnel: 'TOFU',    icono: '🎵', frecuencia: '3×/sem', prioridad: 'alta', accion: 'Crear: "La carne más saludable en 30s"' },
    { canal: 'Instagram',       funnel: 'TOFU',    icono: '📸', frecuencia: '4×/sem', prioridad: 'alta', accion: 'Publicar infografía nutricional' },
    { canal: 'LinkedIn CEO',    funnel: 'MOFU',    icono: '💼', frecuencia: '3×/sem', prioridad: 'critica', accion: 'Activar hoy: 0 posts, 0 impresiones' },
    { canal: 'YouTube',         funnel: 'MOFU',    icono: '▶️', frecuencia: '1×/sem',  prioridad: 'media',  accion: 'Primer vídeo receta: ancas al ajillo' },
    { canal: 'Blog / SEO',      funnel: 'MOFU',    icono: '📝', frecuencia: '1×/sem',  prioridad: 'alta',   accion: 'Artículo: "Rana vs Pollo: comparativa"' },
    { canal: 'Email B2B',       funnel: 'BOFU',    icono: '📧', frecuencia: 'Mensual', prioridad: 'alta',   accion: 'Crear lista + template multi-gama' },
    { canal: 'LinkedIn Sales',  funnel: 'BOFU',    icono: '🎯', frecuencia: 'Semanal', prioridad: 'critica', accion: 'LinkedIn Sales Navigator — contratar' },
    { canal: 'WhatsApp Biz.',   funnel: 'PIPELINE',icono: '💬', frecuencia: 'Diario',  prioridad: 'media',  accion: 'Jarvis IA activo en Grenoucerie Platform' },
]

export default function Funnel({ cambiarVista }) {
    const [activeLevel, setActiveLevel] = useState(null)
    const [activeTab, setActiveTab] = useState('visual')

    const selected = funnelLevels.find(f => f.id === activeLevel)

    return (
        <div className="fade-in">

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">🔻 Embudo de Generación de Mercado</h1>
                    <div className="page-subtitle">
                        TOFU → MOFU → BOFU → Pipeline · Categoría primero, gama después
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {['visual', 'canales', 'calendario'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{
                            padding: '6px 14px',
                            background: activeTab === tab ? 'var(--brand)' : 'var(--bg-elevated)',
                            color: activeTab === tab ? '#fff' : 'var(--text-muted)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '11px', cursor: 'pointer',
                            fontFamily: 'DM Mono, monospace',
                            textTransform: 'capitalize',
                        }}>
                            {tab === 'visual' ? '🔻 Visual' : tab === 'canales' ? '📡 Canales' : '📅 Calendario'}
                        </button>
                    ))}
                </div>
            </div>

            {/* === TAB: VISUAL === */}
            {activeTab === 'visual' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                    {/* Embudo izquierda */}
                    <div className="card">
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                            Click en cada nivel para ver detalle →
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            {funnelLevels.map((level, i) => (
                                <div
                                    key={level.id}
                                    onClick={() => setActiveLevel(activeLevel === level.id ? null : level.id)}
                                    style={{
                                        width: `${level.ancho}%`,
                                        minWidth: '200px',
                                        background: activeLevel === level.id ? level.bg : `${level.color}10`,
                                        border: `1px solid ${activeLevel === level.id ? level.color : level.color + '30'}`,
                                        borderRadius: i === 0 ? '10px 10px 3px 3px' : i === funnelLevels.length - 1 ? '3px 3px 10px 10px' : '3px',
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        transition: 'all 0.25s ease',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '13px' }}>{level.emoji}</span>
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: level.color, fontFamily: 'DM Mono, monospace' }}>{level.label}</span>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{level.title}</span>
                                        </div>
                                        <div style={{ fontSize: '9px', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace', marginTop: '3px' }}>
                                            {level.mensaje.length > 60 ? level.mensaje.slice(0, 60) + '…' : level.mensaje}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: '18px', fontWeight: 700, color: level.color, fontFamily: 'Space Grotesk, sans-serif' }}>{level.metrica}</div>
                                        <div style={{ fontSize: '8px', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace' }}>ahora</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Regla de oro */}
                        <div style={{
                            marginTop: '16px', padding: '12px 14px',
                            background: 'var(--brand-glow)', border: '1px solid var(--border-brand)',
                            borderRadius: 'var(--radius-sm)',
                        }}>
                            <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--brand)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                                🐸 Regla de Oro
                            </div>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                <strong style={{ color: 'var(--brand)' }}>TOFU:</strong> Cero marca, cero gama. Solo <em>rana como categoría</em>.
                                <br />
                                <strong style={{ color: '#93C572' }}>MOFU:</strong> Grenoucerie aparece como experto. Sin empujar venta.
                                <br />
                                <strong style={{ color: '#BAB86C' }}>BOFU:</strong> Aquí sí se vende. Diferenciación por gama.
                            </div>
                        </div>
                    </div>

                    {/* Panel derecho — detalle del nivel seleccionado */}
                    <div>
                        {selected ? (
                            <div className="card" style={{ borderTop: `3px solid ${selected.color}`, height: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '20px' }}>{selected.emoji}</span>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: selected.color, fontFamily: 'Space Grotesk, sans-serif' }}>{selected.label} — {selected.title}</div>
                                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{selected.kpi}</div>
                                    </div>
                                </div>

                                {/* Mensaje */}
                                <div style={{ padding: '10px 12px', background: selected.bg, borderRadius: 'var(--radius-sm)', marginBottom: '14px', borderLeft: `3px solid ${selected.color}` }}>
                                    <div style={{ fontSize: '11.5px', color: 'var(--text-body)', fontStyle: 'italic', lineHeight: 1.5 }}>"{selected.mensaje}"</div>
                                </div>

                                {/* Regla */}
                                <div style={{ fontSize: '10px', color: 'var(--warn)', fontFamily: 'DM Mono, monospace', marginBottom: '10px', padding: '6px 10px', background: 'var(--warn-bg)', borderRadius: 'var(--radius-sm)' }}>
                                    ⚠ {selected.regla}
                                </div>

                                {/* Target */}
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '9px', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', marginBottom: '4px' }}>Target</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{selected.target}</div>
                                </div>

                                {/* Canales */}
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '9px', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', marginBottom: '6px' }}>Canales</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {selected.canales?.map((c, i) => (
                                            <span key={i} style={{
                                                padding: '3px 8px', borderRadius: '3px',
                                                background: `${selected.color}15`,
                                                border: `1px solid ${selected.color}30`,
                                                fontSize: '10px', color: selected.color,
                                                fontFamily: 'DM Mono, monospace',
                                            }}>{c}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Ejemplos */}
                                <div>
                                    <div style={{ fontSize: '9px', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', marginBottom: '6px' }}>Ejemplos de Contenido / Acción</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {selected.ejemplos?.map((ej, i) => (
                                            <div key={i} style={{
                                                padding: '7px 10px',
                                                background: 'var(--bg-elevated)',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--border)',
                                                fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: 1.4,
                                            }}>
                                                {ej}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Meta */}
                                <div style={{ marginTop: '14px', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>Actual: <strong style={{ color: selected.color }}>{selected.metrica}</strong></span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>Meta 90d: <strong style={{ color: 'var(--warn)' }}>{selected.meta}</strong></span>
                                </div>
                            </div>
                        ) : (
                            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ fontSize: '40px' }}>🔻</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', textAlign: 'center' }}>
                                    Selecciona un nivel del embudo<br />para ver el detalle
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* === TAB: CANALES === */}
            {activeTab === 'canales' && (
                <div className="card">
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                        Matriz Canal × Funnel — Estado actual
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {canalFunnel.map((c, i) => {
                            const level = funnelLevels.find(f => f.label === c.funnel)
                            const priColor = c.prioridad === 'critica' ? 'var(--alert)' : c.prioridad === 'alta' ? 'var(--warn)' : 'var(--neutral)'
                            return (
                                <div key={i} style={{
                                    padding: '12px 14px',
                                    background: 'var(--bg-elevated)',
                                    border: `1px solid ${c.prioridad === 'critica' ? 'var(--alert)33' : 'var(--border)'}`,
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex', flexDirection: 'column', gap: '6px',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '16px' }}>{c.icono}</span>
                                            <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-heading)' }}>{c.canal}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                            <span style={{
                                                fontSize: '8.5px', padding: '2px 7px', borderRadius: '10px',
                                                background: `${level?.color || '#666'}18`,
                                                color: level?.color || '#666',
                                                border: `1px solid ${level?.color || '#666'}30`,
                                                fontFamily: 'DM Mono, monospace', fontWeight: 600,
                                            }}>{c.funnel}</span>
                                            <span style={{
                                                fontSize: '8.5px', padding: '2px 7px', borderRadius: '10px',
                                                background: `${priColor}15`, color: priColor,
                                                border: `1px solid ${priColor}30`,
                                                fontFamily: 'DM Mono, monospace',
                                            }}>{c.prioridad}</span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '9px', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace' }}>
                                        Frecuencia: {c.frecuencia}
                                    </div>
                                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                        {c.accion}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* === TAB: CALENDARIO === */}
            {activeTab === 'calendario' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {calendarioEditorial.map((semana, i) => (
                        <div key={i} className="card">
                            <div style={{
                                fontSize: '11px', fontWeight: 700, color: 'var(--brand)',
                                fontFamily: 'DM Mono, monospace', marginBottom: '12px',
                                textTransform: 'uppercase', letterSpacing: '0.5px',
                            }}>
                                📅 {semana.semana}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
                                {semana.contenidos.map((c, j) => {
                                    const tipoColor = c.tipo === 'TOFU' ? '#6b8a5e' : c.tipo === 'MOFU' ? '#93C572' : '#BAB86C'
                                    return (
                                        <div key={j} style={{
                                            padding: '10px 12px',
                                            background: `${tipoColor}0f`,
                                            border: `1px solid ${tipoColor}25`,
                                            borderRadius: 'var(--radius-sm)',
                                            borderLeft: `3px solid ${tipoColor}`,
                                        }}>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '5px' }}>
                                                <span style={{
                                                    fontSize: '8.5px', padding: '2px 7px', borderRadius: '10px',
                                                    background: `${tipoColor}18`, color: tipoColor,
                                                    fontFamily: 'DM Mono, monospace', fontWeight: 700,
                                                    border: `1px solid ${tipoColor}30`,
                                                }}>{c.tipo}</span>
                                                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-body)' }}>{c.canal}</span>
                                            </div>
                                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{c.texto}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    )
}
