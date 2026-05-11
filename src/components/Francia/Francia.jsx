// Sub-dashboard Francia v3.0: Penetrar mercado existente con formatos nuevos
import { franciaData, gamas } from '../../data/grenoucerie'
import { useState } from 'react'

export default function Francia() {
    const [nuevoTarget, setNuevoTarget] = useState('')
    const [targets, setTargets] = useState(franciaData.targets || [])

    const agregarTarget = () => {
        if (!nuevoTarget.trim()) return
        setTargets([...targets, { nombre: nuevoTarget, estado: 'investigando' }])
        setNuevoTarget('')
    }

    return (
        <div>
            <div className="page-header">
                <h2>🇫🇷 Estrategia Francia v3.0</h2>
                <p>Penetrar mercado existente (x20 España) con formatos nuevos — NO crear categoría</p>
            </div>

            {/* Diferencia clave ES vs FR */}
            <div className="card" style={{
                marginBottom: '24px',
                borderColor: 'rgba(244, 67, 54, 0.3)',
                background: 'rgba(244, 67, 54, 0.04)',
                padding: '18px 24px',
            }}>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: 'var(--alert)' }}>
                    ⚠️ Diferencia Fundamental: Francia ≠ España
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {franciaData.diferencia}
                </div>
            </div>

            {/* España vs Francia tabla */}
            <div className="section-title">Comparativa de Mercado</div>
            <div className="card" style={{ marginBottom: '24px' }}>
                <table className="tabla">
                    <thead>
                        <tr><th>Dimensión</th><th>🇪🇸 España</th><th>🇫🇷 Francia</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>¿Conocen la rana?</td><td>No (educar)</td><td style={{ fontWeight: 700, color: 'var(--pistacho)' }}>SÍ (tradición centenaria)</td></tr>
                        <tr><td>Tamaño de mercado</td><td>X</td><td style={{ fontWeight: 700, color: 'var(--pistacho)' }}>X × 20</td></tr>
                        <tr><td>¿Hay premium congelada?</td><td>Casi no</td><td style={{ fontWeight: 700, color: 'var(--rojo)' }}>NO → oportunidad</td></tr>
                        <tr><td>¿Hay despieces?</td><td>No</td><td style={{ fontWeight: 700, color: 'var(--rojo)' }}>NO → oportunidad</td></tr>
                        <tr><td>Estrategia embudo</td><td>TOFU: crear categoría</td><td style={{ fontWeight: 700, color: 'var(--oliva-light)' }}>MOFU: educar sobre gamas nuevas</td></tr>
                    </tbody>
                </table>
            </div>

            {/* Narrativa*/}
            <div className="card" style={{
                marginBottom: '24px',
                borderColor: 'rgba(128, 128, 0, 0.3)',
                background: 'rgba(128, 128, 0, 0.05)',
            }}>
                <div style={{ fontSize: '11px', color: 'var(--oliva-light)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '10px' }}>
                    🎯 NARRATIVA ANCLA FRANCIA
                </div>
                <blockquote style={{
                    fontStyle: 'italic', fontSize: '16px', fontWeight: 600,
                    color: 'var(--text-primary)', lineHeight: 1.6,
                    borderLeft: '3px solid var(--oliva)', paddingLeft: '16px',
                }}>
                    "{franciaData.narrativa}"
                </blockquote>
            </div>

            {/* Oportunidades específicas */}
            <div className="section-title">Oportunidades de Penetración</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {franciaData.oportunidades.map((o, i) => (
                    <div key={i} className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '18px' }}>💎</span>
                        <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{o}</span>
                    </div>
                ))}
            </div>

            {/* Diagnóstico AquaPremium */}
            <div className="section-title">Caballo de Troya: AquaPremium</div>
            <div className="grid-3" style={{ marginBottom: '24px' }}>
                <div className="card card-sm">
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Rol</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>{franciaData.aquapremium.rol}</div>
                </div>
                <div className="card card-sm">
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Aporta</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{franciaData.aquapremium.aporte}</div>
                </div>
                <div className="card card-sm">
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Estado</div>
                    <div style={{ fontWeight: 700, color: 'var(--rojo)', fontSize: '13px' }}>{franciaData.aquapremium.estado}</div>
                </div>
            </div>

            {/* Plan 90 días */}
            <div className="section-title">Plan 90 Días Francia</div>
            <div className="card" style={{ marginBottom: '24px' }}>
                <table className="tabla">
                    <thead><tr><th>Semana</th><th>Acción</th></tr></thead>
                    <tbody>
                        {franciaData.hitos.map((h, i) => (
                            <tr key={i}>
                                <td><span className="badge badge-oliva">{h.semana}</span></td>
                                <td>{h.accion}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ marginTop: '14px', padding: '10px 14px', background: 'var(--accent-dim)', borderRadius: '8px', border: '1px solid var(--border-brand)' }}>
                    💰 Presupuesto 90 días Francia: <strong style={{ color: 'var(--brand)' }}>{franciaData.presupuesto90}</strong>
                </div>
            </div>

            {/* Qué formatos atacar en FR */}
            <div className="section-title">Formatos de Entrada Francia</div>
            <div className="grid-4" style={{ marginBottom: '24px' }}>
                {gamas.map(g => (
                    <div key={g.id} className="card card-sm" style={{
                        borderTop: `3px solid ${g.color}`,
                        opacity: g.id === 'club' ? 0.5 : 1,
                    }}>
                        <div style={{ fontSize: '18px', marginBottom: '4px' }}>{g.emoji}</div>
                        <div style={{ fontWeight: 700, fontSize: '12px', color: g.color }}>{g.nombre}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                            {g.id === 'vietnam' && "Entrada inmediata: distribuidores FR que ya manejan rana importada"}
                            {g.id === 'premium' && "OPORTUNIDAD: no existe posicionada en FR — primera entrada real"}
                            {g.id === 'club' && "Fase 2: cuando AquaPremium produzca fresca localmente"}
                            {g.id === 'despieces' && "INNOVACIÓN PURA: nadie en FR ofrece despieces — diferenciación total"}
                        </div>
                    </div>
                ))}
            </div>

            {/* Targets */}
            <div className="section-title">Targets Francia ({targets.length}/50)</div>
            <div className="card" style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <input
                        style={{
                            flex: 1, padding: '10px 14px',
                            background: 'rgba(147, 197, 114, 0.05)', border: '1px solid var(--border)',
                            borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px',
                            outline: 'none', fontFamily: 'Inter, sans-serif',
                        }}
                        placeholder="Distribuidor o restaurante francés..."
                        value={nuevoTarget}
                        onChange={e => setNuevoTarget(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && agregarTarget()}
                    />
                    <button className="btn btn-primary" onClick={agregarTarget}>Añadir</button>
                </div>
                {targets.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '20px 0' }}>
                        Sin targets aún — Investigar en Rungis, Transgourmet FR, Metro FR, Guía Michelin FR
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {targets.map((t, i) => (
                            <div key={i} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '8px 12px', background: 'rgba(147, 197, 114, 0.04)',
                                border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px',
                            }}>
                                <span>🇫🇷 {t.nombre}</span>
                                <span className="badge badge-oliva">{t.estado}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
