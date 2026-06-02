// 🐸 Grenoucerie — Francia €500K · Centro de Mando Operativo
// Grenoucerie S.L. — Version 1.0
import { useKpiFrancia } from '../../hooks/useKpiFrancia'
import { franciaPanelData } from '../../data/grenoucerie'

// ─── Helpers ────────────────────────────────────────────────
function formatEur(n) {
    if (n >= 1000) return `€${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`
    return `€${n}`
}

function semaforoKpi(id, val) {
    if (id === 'pipeline')  return val < 50000  ? 'var(--alert)' : val < 200000 ? 'var(--warn)' : 'var(--ok)'
    if (id === 'leads')     return val < 20     ? 'var(--warn)'  : 'var(--ok)'
    if (id === 'deals')     return val === 0    ? 'var(--alert)' : 'var(--ok)'
    if (id === 'dias')      return val < 60     ? 'var(--alert)' : val < 120 ? 'var(--warn)' : 'var(--brand)'
    return 'var(--brand)'
}

// ─── KPI Card ───────────────────────────────────────────────
function KpiCard({ label, value, sub, colorId, raw }) {
    const color = semaforoKpi(colorId, raw)
    return (
        <div style={{
            padding: '16px 18px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            flex: '1 1 140px',
            minWidth: '130px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: color }} />
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                {label}
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color, lineHeight: 1 }}>
                {value}
            </div>
            {sub && (
                <div style={{ fontSize: '9.5px', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace' }}>
                    {sub}
                </div>
            )}
        </div>
    )
}

// ─── Barra de progreso ──────────────────────────────────────
function ProgressBar({ pipeline, objetivo, pct }) {
    const pctClamped = Math.min(100, Math.max(0, pct))
    const barColor = pctClamped < 10 ? 'var(--alert)' : pctClamped < 40 ? 'var(--warn)' : 'var(--ok)'
    return (
        <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Progreso objetivo Francia
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', color: barColor, fontWeight: 700 }}>
                    {pctClamped}% completado
                </div>
            </div>
            <div style={{ position: 'relative', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${pctClamped}%`,
                    background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
                    borderRadius: '4px',
                    transition: 'width 0.6s ease',
                    minWidth: pctClamped > 0 ? '6px' : '0',
                }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'DM Mono, monospace', color: 'var(--text-faint)' }}>
                <span>€0 · inicio</span>
                <span style={{ color: 'var(--text-muted)' }}>{formatEur(pipeline)} conseguidos</span>
                <span>€500K · dic 2026</span>
            </div>
        </div>
    )
}

// ─── Status bar Hermes ──────────────────────────────────────
function HermesBar({ connected }) {
    const { hermes } = franciaPanelData
    return (
        <div style={{
            padding: '10px 16px',
            background: 'var(--bg-overlay, #0a0f0a)',
            border: '1px solid rgba(74,124,63,0.3)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
        }}>
            {/* Indicador pulsante */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <div style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: 'var(--ok)',
                    boxShadow: '0 0 6px var(--ok)',
                    animation: 'pulse-dot 2s infinite',
                }} />
                <span style={{ fontSize: '10px', fontFamily: 'DM Mono, monospace', color: 'var(--ok)', fontWeight: 700 }}>
                    {hermes.nombre} activo
                </span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
            {/* Skills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
                {hermes.skills.map((s, i) => (
                    <span key={i} style={{
                        padding: '1px 6px',
                        borderRadius: '10px',
                        fontSize: '8.5px',
                        fontFamily: 'DM Mono, monospace',
                        background: 'rgba(74,124,63,0.15)',
                        color: 'var(--brand)',
                        border: '1px solid rgba(74,124,63,0.25)',
                    }}>{s}</span>
                ))}
            </div>
            {/* Indicador conexión Supabase */}
            <span style={{
                fontSize: '8px',
                fontFamily: 'DM Mono, monospace',
                color: connected ? 'var(--ok)' : 'var(--text-faint)',
                padding: '1px 6px',
                borderRadius: '10px',
                background: connected ? 'var(--ok-bg)' : 'transparent',
                border: `1px solid ${connected ? 'var(--ok)33' : 'var(--border)'}`,
                flexShrink: 0,
            }}>
                {connected ? '● DB live' : '○ sin conexión'}
            </span>
        </div>
    )
}

// ─── Botón de módulo ────────────────────────────────────────
function ModuloBtn({ id, label, icon, url, badge, color, desc }) {
    const isHermes = badge === 'HERMES'
    const isDisabled = url === null

    const handleClick = () => {
        if (url) window.open(url, '_blank', 'noopener,noreferrer')
    }

    return (
        <div
            onClick={handleClick}
            title={isDisabled ? 'Próximamente — Hermes en configuración' : `Abrir ${label}`}
            style={{
                padding: '14px 16px',
                background: `${color}0d`,
                border: `1px solid ${color}30`,
                borderRadius: 'var(--radius-md)',
                cursor: isDisabled ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                opacity: isDisabled ? 0.6 : 1,
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden',
            }}
            onMouseEnter={e => {
                if (!isDisabled) {
                    e.currentTarget.style.background = `${color}1a`
                    e.currentTarget.style.borderColor = `${color}55`
                    e.currentTarget.style.transform = 'translateY(-1px)'
                }
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = `${color}0d`
                e.currentTarget.style.borderColor = `${color}30`
                e.currentTarget.style.transform = 'translateY(0)'
            }}
        >
            {/* Badge */}
            <div style={{ position: 'absolute', top: '8px', right: '10px' }}>
                <span style={{
                    padding: '1px 5px',
                    borderRadius: '4px',
                    fontSize: '7.5px',
                    fontFamily: 'DM Mono, monospace',
                    fontWeight: 700,
                    letterSpacing: '0.3px',
                    background: isHermes ? 'rgba(202,138,4,0.15)' : `${color}15`,
                    color: isHermes ? '#ca8a04' : color,
                    border: `1px solid ${isHermes ? 'rgba(202,138,4,0.3)' : color + '33'}`,
                }}>
                    {badge}
                </span>
            </div>

            {/* Icono + nombre */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>{icon}</span>
                <div style={{ fontSize: '12px', fontWeight: 700, color, fontFamily: 'Space Grotesk, sans-serif' }}>
                    {label}
                </div>
            </div>

            {/* Descripción */}
            <div style={{ fontSize: '9.5px', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace', lineHeight: 1.4 }}>
                {isDisabled ? '⚙️ Próximamente' : desc}
            </div>

            {/* Indicador de enlace externo */}
            {!isDisabled && (
                <div style={{ fontSize: '8px', color, fontFamily: 'DM Mono, monospace', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span>abrir ↗</span>
                </div>
            )}
        </div>
    )
}

// ─── Pipeline visual mini ────────────────────────────────────
function PipelineMini() {
    const { pipeline_stages } = franciaPanelData
    return (
        <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                Pipeline Francia — 8 etapas HubSpot
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {pipeline_stages.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '50px', fontSize: '8px', fontFamily: 'DM Mono, monospace', color: 'var(--text-faint)', textAlign: 'right', flexShrink: 0 }}>
                            {s.pct}%
                        </div>
                        <div style={{ flex: 1, height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${s.pct}%`, background: 'var(--brand)', borderRadius: '2px' }} />
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', width: '140px', flexShrink: 0 }}>
                            {s.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Componente principal ────────────────────────────────────
export default function FranciaPanel() {
    const kpi = useKpiFrancia()
    const today = new Date().toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })

    return (
        <div className="fade-in">

            {/* Header */}
            <div className="page-header" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                        <h1 className="page-title" style={{ marginBottom: '4px' }}>
                            🇫🇷 Francia €500K — Centro de Mando
                        </h1>
                        <div className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ textTransform: 'capitalize' }}>{today}</span>
                            <span style={{ color: 'var(--text-faint)' }}>·</span>
                            <span>Objetivo €500.000 · Diciembre 2026</span>
                            {kpi.connected && (
                                <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '10px', background: 'var(--ok-bg)', color: 'var(--ok)', border: '1px solid var(--ok)33', fontFamily: 'DM Mono, monospace' }}>
                                    ● live
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Countdown badge */}
                    <div style={{
                        padding: '8px 14px',
                        background: kpi.dias_restantes < 60 ? 'var(--alert-bg)' : kpi.dias_restantes < 120 ? 'var(--warn-bg)' : 'var(--brand-glow)',
                        border: `1px solid ${kpi.dias_restantes < 60 ? 'var(--alert)33' : kpi.dias_restantes < 120 ? 'var(--warn)33' : 'var(--border-brand)'}`,
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                        flexShrink: 0,
                    }}>
                        <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: semaforoKpi('dias', kpi.dias_restantes), lineHeight: 1 }}>
                            {kpi.loading ? '···' : kpi.dias_restantes}
                        </div>
                        <div style={{ fontSize: '8px', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace', marginTop: '2px' }}>
                            días restantes
                        </div>
                    </div>
                </div>
            </div>

            {/* 3 KPI cards (días restantes ya está en header) */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <KpiCard
                    label="Pipeline FR"
                    value={kpi.loading ? '···' : formatEur(kpi.pipeline_eur)}
                    sub={`${kpi.pct_objetivo}% del objetivo €500K`}
                    colorId="pipeline"
                    raw={kpi.pipeline_eur}
                />
                <KpiCard
                    label="Leads activos"
                    value={kpi.loading ? '···' : String(kpi.leads_activos)}
                    sub="en secuencia Hermes"
                    colorId="leads"
                    raw={kpi.leads_activos}
                />
                <KpiCard
                    label="Deals respondidos"
                    value={kpi.loading ? '···' : String(kpi.deals_activos)}
                    sub="con interés confirmado"
                    colorId="deals"
                    raw={kpi.deals_activos}
                />
            </div>

            {/* Barra de progreso */}
            <div style={{ marginBottom: '16px' }}>
                <ProgressBar
                    pipeline={kpi.pipeline_eur}
                    objetivo={kpi.objetivo_eur}
                    pct={kpi.pct_objetivo}
                />
            </div>

            {/* Hermes status bar */}
            <div style={{ marginBottom: '20px' }}>
                <HermesBar connected={kpi.connected} />
            </div>

            {/* 6 módulos */}
            <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div className="section-label" style={{ margin: 0 }}>Herramientas del ecosistema</div>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                    <div style={{ fontSize: '9px', fontFamily: 'DM Mono, monospace', color: 'var(--text-faint)' }}>
                        click para abrir
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {franciaPanelData.modulos.map(m => (
                        <ModuloBtn key={m.id} {...m} />
                    ))}
                </div>
            </div>

            {/* Pipeline visual + alerta */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                <PipelineMini />

                {/* Bloqueo crítico / siguiente acción */}
                <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Próximas acciones críticas
                    </div>
                    {[
                        { icono: '🔴', urgencia: 'HOY', texto: 'Crear pipeline "Francia €500K" en HubSpot con 8 etapas y propiedades custom' },
                        { icono: '🔴', urgencia: 'Esta semana', texto: 'Verificar dominio grenoucerie.es en Brevo (SPF + DKIM + DMARC)' },
                        { icono: '🟡', urgencia: 'Semana 2', texto: 'Activar Hermes scraper — lista 50 distribuidores FR tier 1 (Sirene/INSEE)' },
                        { icono: '🟡', urgencia: 'Semana 2', texto: 'Lanzar Secuencia A (mayoristas) con warming 20→50→100 emails/día' },
                        { icono: '🟢', urgencia: 'Semana 3', texto: 'Primer brief Hermes vía WhatsApp viernes 17h con métricas reales' },
                    ].map((a, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 10px',
                            background: i < 2 ? 'var(--alert-bg)' : i < 4 ? 'var(--warn-bg)' : 'var(--ok-bg)',
                            borderRadius: 'var(--radius-sm)',
                            border: `1px solid ${i < 2 ? 'var(--alert)' : i < 4 ? 'var(--warn)' : 'var(--ok)'}22`,
                        }}>
                            <span style={{ fontSize: '11px', flexShrink: 0, marginTop: '1px' }}>{a.icono}</span>
                            <div style={{ flex: 1, fontSize: '10.5px', color: 'var(--text-body)', lineHeight: 1.4 }}>{a.texto}</div>
                            <span style={{
                                fontSize: '8px', flexShrink: 0, padding: '2px 5px', borderRadius: '8px',
                                fontFamily: 'DM Mono, monospace', whiteSpace: 'nowrap',
                                background: i < 2 ? 'var(--alert-bg)' : i < 4 ? 'var(--warn-bg)' : 'var(--ok-bg)',
                                color: i < 2 ? 'var(--alert)' : i < 4 ? 'var(--warn)' : 'var(--ok)',
                                border: `1px solid ${i < 2 ? 'var(--alert)' : i < 4 ? 'var(--warn)' : 'var(--ok)'}44`,
                            }}>{a.urgencia}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* CSS inline para animación pulse */}
            <style>{`
                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; box-shadow: 0 0 6px var(--ok); }
                    50%       { opacity: 0.4; box-shadow: 0 0 2px var(--ok); }
                }
            `}</style>

        </div>
    )
}
