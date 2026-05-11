// Pipeline Kanban Multi-Gama v4.0 — Drag & Drop real + Embudo visual + Métricas
import { useState, useRef, useCallback } from 'react'
import { pipelineColumnas, gamas, embudo } from '../../data/grenoucerie'

// Descripciones de cada fase del pipeline
const descripcionesFase = {
    prospeccion: "Identificar targets multi-gama",
    contacto: "Outreach por LinkedIn/email/feria",
    muestra: "Kit muestra o reunión comercial",
    negociacion: "Propuesta comercial enviada",
    activo: "Primer pedido — reposición activa",
    embajador: "Referidor que trae nuevos leads",
}

// Iconos de cada fase
const iconosFase = {
    prospeccion: "🔍",
    contacto: "📞",
    muestra: "📦",
    negociacion: "🤝",
    activo: "✅",
    embajador: "⭐",
}

// Colores por gama para las tarjetas
const gamaColores = {}
gamas.forEach(g => { gamaColores[g.nombre] = g.color })

// Componente visual del embudo TOFU->MOFU->BOFU
function EmbudoVisual() {
    const niveles = [
        {
            id: 'tofu', nombre: 'TOFU', subtitulo: '"Que suene la rana"',
            color: '#6b8a5e', ancho: 100,
            regla: embudo.tofu.regla,
            mensaje: embudo.tofu.mensaje,
            target: embudo.tofu.target,
        },
        {
            id: 'mofu', nombre: 'MOFU', subtitulo: 'Educación + Deseo',
            color: '#93C572', ancho: 70,
            regla: embudo.mofu.regla,
            mensaje: embudo.mofu.mensaje,
            target: embudo.mofu.targets.map(t => `${t.icono} ${t.nombre}`).join(' · '),
        },
        {
            id: 'bofu', nombre: 'BOFU', subtitulo: 'Diferenciación por Gama',
            color: '#BAB86C', ancho: 40,
            regla: embudo.bofu.regla,
            mensaje: embudo.bofu.mensaje,
            target: 'Leads cualificados → 4 gamas',
        },
        {
            id: 'pipeline', nombre: 'PIPELINE', subtitulo: 'Conversión B2B',
            color: '#4caf50', ancho: 25,
            regla: '6 fases: Prospección → Embajador',
            mensaje: 'Lead entra segmentado por gama',
            target: 'Hosteleros, distribuidores, grupos',
        },
    ]

    return (
        <div className="card" style={{ marginBottom: '24px', overflow: 'hidden' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>
                🔻 Embudo de Generación de Mercado
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                {niveles.map((nivel, i) => (
                    <div key={nivel.id} style={{
                        width: `${nivel.ancho}%`,
                        minWidth: '200px',
                        background: `${nivel.color}18`,
                        border: `1px solid ${nivel.color}44`,
                        borderRadius: i === 0 ? '12px 12px 4px 4px' : i === niveles.length - 1 ? '4px 4px 12px 12px' : '4px',
                        padding: '12px 16px',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        cursor: 'default',
                        position: 'relative',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${nivel.color}30`; e.currentTarget.style.transform = 'scale(1.02)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${nivel.color}18`; e.currentTarget.style.transform = 'scale(1)' }}
                    >
                        <div style={{ fontWeight: 800, fontSize: '13px', color: nivel.color }}>{nivel.nombre}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{nivel.subtitulo}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                            {nivel.mensaje}
                        </div>
                        {i < niveles.length - 1 && (
                            <div style={{
                                position: 'absolute', bottom: '-12px', left: '50%', transform: 'translateX(-50%)',
                                color: 'var(--text-muted)', fontSize: '10px', zIndex: 1,
                            }}>▼</div>
                        )}
                    </div>
                ))}
            </div>
            <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)' }}>
                La demanda se genera arriba (consumidor) y se cosecha abajo (pipeline B2B)
            </div>
        </div>
    )
}

// Tarjeta de lead draggable
function KanbanCard({ card, onDragStart, onClick }) {
    const colorGama = gamaColores[card.tipo] || 'var(--text-muted)'
    return (
        <div
            className="kanban-card"
            draggable
            onDragStart={(e) => onDragStart(e, card)}
            onClick={() => onClick(card)}
            style={{ cursor: 'grab' }}
        >
            <div className="kanban-card-name">{card.nombre}</div>
            <div className="kanban-card-meta">{card.valor || 'Sin valor estimado'}</div>
            <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 700,
                    background: `${colorGama}22`, color: colorGama, border: `1px solid ${colorGama}44`,
                }}>
                    {card.tipo}
                </span>
                <span style={{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '9px',
                    background: 'rgba(147, 197, 114, 0.08)', color: 'var(--text-muted)',
                }}>
                    {card.mercado === 'ES' ? '🇪🇸' : '🇫🇷'} {card.mercado}
                </span>
            </div>
        </div>
    )
}

// Columna del Kanban con drag & drop real
function KanbanColumna({ columna, onDragStart, onDrop, onAddCard, onCardClick }) {
    const [hovering, setHovering] = useState(false)

    const handleDragOver = (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setHovering(true)
    }

    return (
        <div
            className="kanban-col"
            style={{
                borderTop: `3px solid ${columna.color}`,
                background: hovering ? `${columna.color}08` : undefined,
                transition: 'background 0.2s ease',
            }}
            onDragOver={handleDragOver}
            onDragLeave={() => setHovering(false)}
            onDrop={(e) => { e.preventDefault(); setHovering(false); onDrop(e, columna.id) }}
        >
            <div className="kanban-col-header">
                <span style={{ color: columna.color }}>
                    {iconosFase[columna.id]} {columna.nombre.toUpperCase()}
                </span>
                <span className="kanban-count">{columna.cards.length}</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.4 }}>
                {descripcionesFase[columna.id]}
            </div>

            {columna.cards.map((card) => (
                <KanbanCard
                    key={card.id}
                    card={card}
                    onDragStart={onDragStart}
                    onClick={onCardClick}
                />
            ))}

            <button
                onClick={() => onAddCard(columna.id)}
                style={{
                    width: '100%', padding: '8px', marginTop: '8px',
                    background: 'transparent', border: '1px dashed var(--border)', borderRadius: '8px',
                    color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.target.style.borderColor = 'var(--pistacho)'; e.target.style.color = 'var(--pistacho)' }}
                onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-muted)' }}
            >
                + Añadir lead
            </button>
        </div>
    )
}

// Modal para crear nuevo lead
function ModalNuevoLead({ columnaId, onGuardar, onCerrar }) {
    const [form, setForm] = useState({ nombre: '', tipo: 'Vietnam', mercado: 'ES', valor: '', notas: '' })

    const handleGuardar = () => {
        if (!form.nombre.trim()) return
        onGuardar(columnaId, { ...form, id: `lead-${Date.now()}`, fechaCreacion: new Date().toLocaleDateString('es-ES') })
        onCerrar()
    }

    const inputStyle = {
        width: '100%', padding: '10px 14px',
        background: 'rgba(147, 197, 114, 0.05)', border: '1px solid var(--border)',
        borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px',
        outline: 'none', marginBottom: '12px', fontFamily: 'Inter, sans-serif',
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={onCerrar}>
            <div className="card" style={{ width: '420px', maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
                <h3 style={{ marginBottom: '20px', fontWeight: 700 }}>
                    {iconosFase[columnaId]} Nuevo Lead Multi-Gama
                </h3>
                <input
                    style={inputStyle}
                    placeholder="Nombre empresa / restaurante / distribuidor"
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    autoFocus
                />
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.tipo}
                    onChange={e => setForm({ ...form, tipo: e.target.value })}>
                    <option value="Vietnam">🇻🇳 Vietnam — Distrib. mayorista / Cadena congelados</option>
                    <option value="Premium">⭐ Premium — Distrib. gourmet / Restaurante</option>
                    <option value="Club">👑 Club/Fresca — Restaurante top (venta directa)</option>
                    <option value="Despieces">🔪 Despieces — Cualquier canal (innovación)</option>
                </select>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.mercado}
                    onChange={e => setForm({ ...form, mercado: e.target.value })}>
                    <option value="ES">🇪🇸 España</option>
                    <option value="FR">🇫🇷 Francia</option>
                </select>
                <input
                    style={inputStyle}
                    placeholder="Valor estimado (ej: €500/mes, Volumen alto...)"
                    value={form.valor}
                    onChange={e => setForm({ ...form, valor: e.target.value })}
                />
                <textarea
                    style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                    placeholder="Notas (contacto, interés, próxima acción...)"
                    value={form.notas}
                    onChange={e => setForm({ ...form, notas: e.target.value })}
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={onCerrar}>Cancelar</button>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleGuardar}>Guardar Lead</button>
                </div>
            </div>
        </div>
    )
}

// Panel lateral de detalle del lead
function PanelDetalleLead({ card, columnaActual, onCerrar, onEliminar }) {
    if (!card) return null
    const colorGama = gamaColores[card.tipo] || 'var(--text-muted)'

    return (
        <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '360px', maxWidth: '90vw',
            background: 'var(--bg-elevated)', borderLeft: `2px solid ${colorGama}44`,
            padding: '28px 24px', zIndex: 999, overflowY: 'auto',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
            animation: 'slideIn 0.2s ease',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-heading)' }}>{card.nombre}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Creado: {card.fechaCreacion || '—'}
                    </div>
                </div>
                <button onClick={onCerrar} style={{
                    background: 'transparent', border: 'none', color: 'var(--text-muted)',
                    fontSize: '20px', cursor: 'pointer', lineHeight: 1,
                }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <span style={{
                    padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                    background: `${colorGama}22`, color: colorGama, border: `1px solid ${colorGama}44`,
                }}>{card.tipo}</span>
                <span style={{
                    padding: '4px 12px', borderRadius: '6px', fontSize: '11px',
                    background: 'rgba(147, 197, 114, 0.08)', color: 'var(--text-secondary)',
                }}>{card.mercado === 'ES' ? '🇪🇸 España' : '🇫🇷 Francia'}</span>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                    Fase Actual
                </div>
                <div style={{
                    padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                    background: 'rgba(147, 197, 114, 0.06)', color: 'var(--pistacho)',
                }}>
                    {iconosFase[columnaActual]} {columnaActual?.charAt(0).toUpperCase() + columnaActual?.slice(1)}
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                    Valor Estimado
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-body)' }}>{card.valor || 'Sin estimar'}</div>
            </div>

            {card.notas && (
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                        Notas
                    </div>
                    <div style={{
                        fontSize: '12px', color: 'var(--text-body)', lineHeight: 1.6,
                        padding: '10px', background: 'var(--bg-overlay)', borderRadius: '8px',
                        border: '1px solid var(--border)',
                    }}>{card.notas}</div>
                </div>
            )}

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                    💡 Próximo Paso Sugerido
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-body)', lineHeight: 1.6 }}>
                    {columnaActual === 'prospeccion' && 'Investigar la empresa, identificar decisor de compras e iniciar contacto por LinkedIn o email.'}
                    {columnaActual === 'contacto' && 'Personalizar el mensaje según su gama ideal y agendar una llamada o reunión de 15 min.'}
                    {columnaActual === 'muestra' && 'Enviar kit de muestra calibrada (La Perla / Belly Off) con dossier de rentabilidad adjunto.'}
                    {columnaActual === 'negociacion' && 'Enviar propuesta con pricing por gama y condiciones trimestrales. Usar el argumento 60-70% margen.'}
                    {columnaActual === 'activo' && 'Seguimiento post-primer pedido a las 72h. Proponer planificación trimestral para fidelizar.'}
                    {columnaActual === 'embajador' && '¡Activar programa de referidos! Pedirle que recomiende y ofrecer condiciones VIP por nuevos clientes.'}
                </div>
            </div>

            <button
                className="btn btn-outline"
                style={{ width: '100%', marginTop: '20px', color: 'var(--rojo)', borderColor: 'rgba(244, 67, 54, 0.3)' }}
                onClick={() => onEliminar(card.id)}
            >
                🗑️ Eliminar lead
            </button>
        </div>
    )
}

// Barra de métricas de conversión entre fases
function MetricasConversion({ columnas }) {
    const fases = columnas.map(col => col.cards.length)
    const tasas = []
    for (let i = 1; i < fases.length; i++) {
        tasas.push(fases[i - 1] > 0 ? Math.round((fases[i] / fases[i - 1]) * 100) : 0)
    }

    return (
        <div className="card" style={{ marginBottom: '20px', padding: '14px 18px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                📊 Tasa de Conversión entre Fases
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                {columnas.map((col, i) => (
                    <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{
                            padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                            background: `${col.color}18`, color: col.color,
                            minWidth: '64px', textAlign: 'center',
                        }}>
                            {col.cards.length} {col.nombre.split(' ')[0].slice(0, 6)}
                        </div>
                        {i < columnas.length - 1 && (
                            <div style={{
                                fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                                color: tasas[i] > 50 ? 'var(--ok)' : tasas[i] > 20 ? 'var(--warn)' : 'var(--alert)',
                                background: tasas[i] > 50 ? 'var(--ok-bg)' : tasas[i] > 20 ? 'var(--warn-bg)' : 'var(--alert-bg)',
                            }}>
                                →{tasas[i]}%
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

// === COMPONENTE PRINCIPAL ===
export default function Pipeline() {
    const [columnas, setColumnas] = useState(pipelineColumnas)
    const [modalColumna, setModalColumna] = useState(null)
    const [leadSeleccionado, setLeadSeleccionado] = useState(null)
    const [columnaDelLead, setColumnaDelLead] = useState(null)
    const [vista, setVista] = useState('kanban') // 'kanban' o 'embudo'
    const dragCard = useRef(null)
    const dragSourceCol = useRef(null)

    // Drag & Drop real entre columnas
    const handleDragStart = useCallback((e, card) => {
        dragCard.current = card
        // Encontrar la columna de origen
        const sourceCol = columnas.find(col => col.cards.some(c => c.id === card.id))
        dragSourceCol.current = sourceCol?.id
        e.dataTransfer.effectAllowed = 'move'
        // Efecto visual en la tarjeta que se arrastra
        setTimeout(() => { e.target.style.opacity = '0.4' }, 0)
    }, [columnas])

    const handleDrop = useCallback((e, targetColId) => {
        e.preventDefault()
        const card = dragCard.current
        const sourceColId = dragSourceCol.current

        if (!card || !sourceColId || sourceColId === targetColId) return

        setColumnas(cols => cols.map(col => {
            if (col.id === sourceColId) {
                return { ...col, cards: col.cards.filter(c => c.id !== card.id) }
            }
            if (col.id === targetColId) {
                return { ...col, cards: [...col.cards, card] }
            }
            return col
        }))

        dragCard.current = null
        dragSourceCol.current = null
    }, [])

    const handleAddCard = (columnaId) => setModalColumna(columnaId)
    const handleGuardarCard = (columnaId, card) => {
        setColumnas(cols => cols.map(col =>
            col.id === columnaId ? { ...col, cards: [...col.cards, card] } : col
        ))
    }

    const handleCardClick = (card) => {
        const col = columnas.find(c => c.cards.some(cc => cc.id === card.id))
        setLeadSeleccionado(card)
        setColumnaDelLead(col?.id)
    }

    const handleEliminarLead = (cardId) => {
        setColumnas(cols => cols.map(col => ({
            ...col, cards: col.cards.filter(c => c.id !== cardId)
        })))
        setLeadSeleccionado(null)
    }

    const totalLeads = columnas.reduce((acc, col) => acc + col.cards.length, 0)

    // Conteo por gama
    const porGama = {}
    gamas.forEach(g => { porGama[g.nombre] = 0 })
    columnas.forEach(col => col.cards.forEach(c => { porGama[c.tipo] = (porGama[c.tipo] || 0) + 1 }))

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2>🎯 Pipeline Multi-Gama B2B</h2>
                    <p>6 fases · 4 gamas · {totalLeads} leads — Arrastra las tarjetas entre fases para avanzar leads</p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                        className={vista === 'kanban' ? 'btn btn-primary' : 'btn btn-outline'}
                        style={{ fontSize: '11px', padding: '6px 14px' }}
                        onClick={() => setVista('kanban')}
                    >
                        📋 Kanban
                    </button>
                    <button
                        className={vista === 'embudo' ? 'btn btn-primary' : 'btn btn-outline'}
                        style={{ fontSize: '11px', padding: '6px 14px' }}
                        onClick={() => setVista('embudo')}
                    >
                        🔻 Embudo
                    </button>
                </div>
            </div>

            {/* Métricas por gama */}
            <div className="grid-4" style={{ marginBottom: '20px' }}>
                {gamas.map(g => (
                    <div key={g.id} className="card card-sm" style={{ textAlign: 'center', borderTop: `3px solid ${g.color}` }}>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: g.color }}>{porGama[g.nombre] || 0}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{g.emoji} {g.nombre}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>{g.ratio}</div>
                    </div>
                ))}
            </div>

            {/* Vista: Embudo completo */}
            {vista === 'embudo' && <EmbudoVisual />}

            {/* Métricas de conversión (siempre visible) */}
            <MetricasConversion columnas={columnas} />

            {/* Nota embudo */}
            <div className="card" style={{
                marginBottom: '20px', padding: '12px 18px',
                borderColor: 'rgba(147, 197, 114, 0.3)',
                background: 'rgba(147, 197, 114, 0.04)',
                fontSize: '12px', color: 'var(--text-secondary)',
            }}>
                💡 <strong style={{ color: 'var(--pistacho)' }}>Arrastra las tarjetas</strong> entre columnas para avanzar leads. Haz clic en una tarjeta para ver detalle y próximo paso sugerido.
            </div>

            {/* Kanban Board */}
            <div className="kanban-board">
                {columnas.map(col => (
                    <KanbanColumna
                        key={col.id}
                        columna={col}
                        onDragStart={handleDragStart}
                        onDrop={handleDrop}
                        onAddCard={handleAddCard}
                        onCardClick={handleCardClick}
                    />
                ))}
            </div>

            {/* Modal nuevo lead */}
            {modalColumna && (
                <ModalNuevoLead columnaId={modalColumna}
                    onGuardar={handleGuardarCard} onCerrar={() => setModalColumna(null)} />
            )}

            {/* Panel lateral detalle */}
            {leadSeleccionado && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 998 }}
                        onClick={() => setLeadSeleccionado(null)}
                    />
                    <PanelDetalleLead
                        card={leadSeleccionado}
                        columnaActual={columnaDelLead}
                        onCerrar={() => setLeadSeleccionado(null)}
                        onEliminar={handleEliminarLead}
                    />
                </>
            )}
        </div>
    )
}
