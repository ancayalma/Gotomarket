import { useState } from 'react'
import { roadmap90Dias } from '../../data/grenoucerie'

const phases = [
    { label: 'Cimientos', weeks: 'S1–4', desc: 'CRM multi-gama + TOFU categoría + primeros leads', color: 'var(--brand)' },
    { label: 'Tracción',  weeks: 'S5–8', desc: 'Muestras + despieces + Francia + B2C recetas',    color: 'var(--accent)' },
    { label: 'Pitch',     weeks: 'S9–12', desc: 'Primeros pedidos + deck grupo + datos consolidados', color: 'var(--ok)' },
]

export default function Roadmap() {
    const [done, setDone] = useState([])
    const toggle = (week) => setDone(prev => prev.includes(week) ? prev.filter(w => w !== week) : [...prev, week])
    const progress = Math.round((done.length / roadmap90Dias.length) * 100)
    const currentWeek = roadmap90Dias.find(r => !done.includes(r.semana))?.semana

    return (
        <div className="fade-in">
            <div className="page-header">
                <div className="page-header-inner">
                    <div>
                        <h1 className="page-title">Roadmap 90 Días</h1>
                        <div className="page-subtitle">
                            semana a semana · multi-gama + embudo de categoría · {progress}% completado
                        </div>
                    </div>
                    <div style={{
                        fontFamily: 'DM Mono, monospace',
                        fontSize: '22px',
                        fontWeight: 500,
                        color: progress > 0 ? 'var(--brand)' : 'var(--text-muted)',
                    }}>
                        {progress}%
                    </div>
                </div>
            </div>

            {/* Barra de progreso */}
            <div className="card card-sm" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                    <span>Día 1</span>
                    <span>{done.length} / 12 semanas</span>
                    <span>Día 90 — Presentación grupo</span>
                </div>
                <div className="progress-track" style={{ height: '6px' }}>
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Fases */}
            <div className="grid-3" style={{ marginBottom: '20px' }}>
                {phases.map((p) => (
                    <div key={p.label} className="card card-xs" style={{ borderLeft: `2px solid ${p.color}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '13px', color: 'var(--text-heading)' }}>
                                {p.label}
                            </span>
                            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '9.5px', color: p.color }}>
                                {p.weeks}
                            </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{p.desc}</div>
                    </div>
                ))}
            </div>

            {/* Lista de semanas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {roadmap90Dias.map((item) => {
                    const isDone = done.includes(item.semana)
                    const isCurrent = item.semana === currentWeek
                    return (
                        <div
                            key={item.semana}
                            className={`roadmap-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
                            onClick={() => toggle(item.semana)}
                        >
                            <div className={`roadmap-week-badge ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                                {isDone ? '✓' : `S${item.semana}`}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className={`roadmap-action ${isDone ? 'done' : ''}`}>
                                    {item.accion}
                                </div>
                                <div className="roadmap-meta">
                                    📌 {item.meta} · ✓ {item.criterio}
                                </div>
                            </div>
                            {isCurrent && (
                                <span className="badge badge-brand" style={{ flexShrink: 0 }}>AHORA</span>
                            )}
                        </div>
                    )
                })}
            </div>

            <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                click para marcar como completado
            </div>
        </div>
    )
}
