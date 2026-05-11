// España — Estrategia Mercado Doméstico
import { useState } from 'react'
import { gamas, kpis, roadmap90Dias, nutricion } from '../../data/grenoucerie'

const clientesActuales = [
    { nombre: 'Distribuidores mayoristas (Madrid/BCN)', gama: 'Vietnam', tipo: 'Distribuidor', estado: 'activo', valor: 'Volumen' },
    { nombre: 'Restaurantes 1+ estrella (varios)', gama: 'Premium', tipo: 'Restaurante', estado: 'activo', valor: 'Calidad' },
    { nombre: 'Cadenas horeca (zona centro)', gama: 'Vietnam', tipo: 'Cadena', estado: 'activo', valor: 'Volumen' },
]

const targetList = [
    { segmento: 'Distribuidores Mayoristas', gama: 'Vietnam', cantidad: '20 targets', urgencia: 'critica', descripcion: 'Frescura stock, volumen garantizado, precio competitivo' },
    { segmento: 'Distribuidores Gourmet',    gama: 'Premium', cantidad: '20 targets', urgencia: 'critica', descripcion: 'Calibre superior, diferenciación de catálogo' },
    { segmento: 'Restaurantes Top',          gama: 'Club',    cantidad: '10 targets', urgencia: 'alta',   descripcion: 'Fresca, trazabilidad estanque-plato, CEO directo' },
    { segmento: 'Todos los canales',         gama: 'Despieces', cantidad: 'Transversal', urgencia: 'alta', descripcion: 'Innovación: cortes nunca vistos en el mercado' },
]

export default function Espana({ cambiarVista }) {
    const [tab, setTab] = useState('overview')

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🇪🇸 España — Mercado Doméstico</h1>
                    <div className="page-subtitle">Creación de categoría desde cero · Monoproducto 4 gamas · Target: €720K/año</div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {[['overview', '📊 Overview'], ['gamas', '🐸 4 Gamas'], ['targets', '🎯 Targets'], ['roadmap', '🗺 Roadmap']].map(([id, label]) => (
                        <button key={id} onClick={() => setTab(id)} style={{
                            padding: '6px 12px',
                            background: tab === id ? 'var(--brand)' : 'var(--bg-elevated)',
                            color: tab === id ? '#fff' : 'var(--text-muted)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '11px', cursor: 'pointer',
                            fontFamily: 'DM Mono, monospace',
                        }}>{label}</button>
                    ))}
                </div>
            </div>

            {tab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* KPI tiles */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                        {[
                            { label: 'Facturación mensual', value: '€60K', sub: 'meta €65K en 90d', color: 'var(--ok)' },
                            { label: 'Facturación 2025',    value: '€379K', sub: '+87% vs baseline', color: 'var(--brand)' },
                            { label: 'Run rate 2026',       value: '€720K', sub: 'proyección anual', color: 'var(--ok)' },
                            { label: 'EBITDA recurrente',   value: '-€54K', sub: 'sin subvenciones', color: 'var(--alert)' },
                        ].map((k, i) => (
                            <div key={i} style={{ padding: '16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', borderTop: `3px solid ${k.color}` }}>
                                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.label}</div>
                                <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: k.color, marginTop: '4px' }}>{k.value}</div>
                                <div style={{ fontSize: '9px', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace' }}>{k.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Diagnóstico */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="card">
                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                                ⚡ Situación Actual
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[
                                    { label: 'Clientes activos B2B', valor: '~15', color: 'var(--warn)' },
                                    { label: 'Leads en CRM', valor: '0 🔴', color: 'var(--alert)' },
                                    { label: 'Mix de gamas', valor: '99% Vietnam', color: 'var(--warn)' },
                                    { label: 'Seguidores Instagram', valor: '1.043', color: 'var(--warn)' },
                                    { label: 'Followers LinkedIn', valor: '216', color: 'var(--alert)' },
                                    { label: 'Tráfico web', valor: '~500/mes', color: 'var(--warn)' },
                                    { label: 'Posts publicados', valor: '0 esta semana', color: 'var(--alert)' },
                                ].map((r, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.label}</span>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: r.color, fontFamily: 'Space Grotesk, sans-serif' }}>{r.valor}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Nutrición comparativa */}
                        <div className="card">
                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                                🥗 "La carne más saludable" — Datos
                            </div>
                            <div style={{ fontSize: '9px', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace', marginBottom: '8px' }}>Por 100g de producto</div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                            {['Carne', 'Kcal', 'Grasa (g)', 'Proteína (g)', 'Sin sueño'].map(h => (
                                                <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {nutricion.map((n, i) => (
                                            <tr key={i} style={{
                                                borderBottom: '1px solid var(--border)',
                                                background: n.carne === 'Rana' ? 'var(--ok-bg)' : undefined,
                                            }}>
                                                <td style={{ padding: '7px 8px', fontWeight: n.carne === 'Rana' ? 700 : 400, color: n.carne === 'Rana' ? 'var(--ok)' : 'var(--text-body)' }}>{n.carne === 'Rana' ? '🐸 ' : ''}{n.carne}</td>
                                                <td style={{ padding: '7px 8px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{n.calorias}</td>
                                                <td style={{ padding: '7px 8px', color: n.carne === 'Rana' ? 'var(--ok)' : 'var(--text-muted)', fontFamily: 'DM Mono, monospace', fontWeight: n.carne === 'Rana' ? 700 : 400 }}>{n.grasa}</td>
                                                <td style={{ padding: '7px 8px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{n.proteina}</td>
                                                <td style={{ padding: '7px 8px', color: n.sueno === 'No' ? 'var(--ok)' : 'var(--text-faint)', fontFamily: 'DM Mono, monospace' }}>{n.sueno === 'No' ? '✓ No' : '✗ Sí'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ marginTop: '10px', padding: '8px 10px', background: 'var(--brand-glow)', border: '1px solid var(--border-brand)', borderRadius: 'var(--radius-sm)', fontSize: '10px', color: 'var(--brand)', fontFamily: 'DM Mono, monospace' }}>
                                0.3g grasa/100g · 12× menos grasa que pollo · No da sueño · Proteína completa
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'gamas' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                    {gamas.map(g => (
                        <div key={g.id} style={{
                            padding: '20px',
                            background: 'var(--bg-elevated)',
                            border: `1px solid ${g.color}33`,
                            borderRadius: 'var(--radius-md)',
                            borderTop: `3px solid ${g.color}`,
                        }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
                                <span style={{ fontSize: '28px' }}>{g.emoji}</span>
                                <div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: g.color, fontFamily: 'Space Grotesk, sans-serif' }}>{g.nombre}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{g.tipo}</div>
                                    {g.id === 'despieces' && (
                                        <div style={{ marginTop: '4px', fontSize: '9px', padding: '2px 8px', background: 'var(--accent-dim)', color: 'var(--accent)', borderRadius: '3px', fontFamily: 'DM Mono, monospace', display: 'inline-block' }}>
                                            ★ SIN COMPETIDOR EN MERCADO
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                                <div style={{ padding: '8px 10px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                    <span style={{ fontSize: '9px', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Descripción</span>
                                    <div style={{ color: 'var(--text-body)', marginTop: '2px', lineHeight: 1.4 }}>{g.descripcion}</div>
                                </div>
                                <div style={{ padding: '8px 10px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                    <span style={{ fontSize: '9px', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Cliente objetivo</span>
                                    <div style={{ color: 'var(--text-body)', marginTop: '2px', lineHeight: 1.4 }}>{g.cliente}</div>
                                </div>
                                <div style={{ padding: '8px 10px', background: `${g.color}10`, borderRadius: 'var(--radius-sm)', border: `1px solid ${g.color}25`, borderLeft: `3px solid ${g.color}` }}>
                                    <span style={{ fontSize: '9px', color: g.color, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', fontWeight: 700 }}>Argumento de venta</span>
                                    <div style={{ color: 'var(--text-body)', marginTop: '4px', lineHeight: 1.4 }}>{g.argumento}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'targets' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {targetList.map((t, i) => {
                        const gama = gamas.find(g => g.nombre === t.gama) || gamas[0]
                        const urgColor = t.urgencia === 'critica' ? 'var(--alert)' : 'var(--warn)'
                        return (
                            <div key={i} style={{
                                padding: '16px 20px',
                                background: 'var(--bg-elevated)',
                                border: `1px solid ${gama.color}33`,
                                borderRadius: 'var(--radius-md)',
                                borderLeft: `4px solid ${gama.color}`,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px',
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'Space Grotesk, sans-serif' }}>{t.segmento}</span>
                                        <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '10px', background: `${gama.color}15`, color: gama.color, border: `1px solid ${gama.color}30`, fontFamily: 'DM Mono, monospace' }}>
                                            {gama.emoji} {t.gama}
                                        </span>
                                        <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '10px', background: `${urgColor}15`, color: urgColor, border: `1px solid ${urgColor}30`, fontFamily: 'DM Mono, monospace' }}>
                                            {t.urgencia}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.descripcion}</div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: gama.color, fontFamily: 'Space Grotesk, sans-serif' }}>{t.cantidad}</div>
                                    <div style={{ fontSize: '9px', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace' }}>a prospectar</div>
                                </div>
                            </div>
                        )
                    })}
                    <div style={{
                        padding: '12px 16px', background: 'var(--alert-bg)',
                        border: '1px solid var(--alert)33', borderRadius: 'var(--radius-md)',
                        fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5,
                    }}>
                        🔴 <strong style={{ color: 'var(--alert)' }}>Sin CRM activo</strong>, ninguno de estos targets existe como lead.
                        Activar HubSpot CRM y cargar lista de 50+ targets es la primera acción crítica.
                    </div>
                </div>
            )}

            {tab === 'roadmap' && (
                <div className="card">
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                        🗺 Roadmap 90 días — España (Semana a Semana)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {roadmap90Dias.map((s, i) => {
                            const semanaColor = i < 4 ? 'var(--alert)' : i < 8 ? 'var(--warn)' : 'var(--ok)'
                            return (
                                <div key={i} style={{
                                    display: 'flex', gap: '14px', alignItems: 'flex-start',
                                    padding: '10px 12px',
                                    background: 'var(--bg-elevated)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border)',
                                }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        background: `${semanaColor}15`, border: `1px solid ${semanaColor}33`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '10px', fontWeight: 700, color: semanaColor,
                                        fontFamily: 'DM Mono, monospace', flexShrink: 0,
                                    }}>
                                        S{s.semana}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-body)', lineHeight: 1.4, marginBottom: '3px' }}>{s.accion}</div>
                                        <div style={{ fontSize: '9px', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace' }}>
                                            Criterio: {s.criterio}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '9px', color: semanaColor, fontFamily: 'DM Mono, monospace', flexShrink: 0, padding: '2px 7px', background: `${semanaColor}10`, borderRadius: '10px', border: `1px solid ${semanaColor}25` }}>
                                        {s.meta.length > 25 ? s.meta.slice(0, 25) + '…' : s.meta}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
