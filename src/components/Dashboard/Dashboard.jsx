import { useState } from 'react'
import { kpis, empresa, franciaData } from '../../data/grenoucerie'

// ─── Datos de los 3 mercados ──────────────────────────────────────────────────
const mercados = [
    {
        id: 'espana',
        bandera: '🇪🇸',
        nombre: 'España',
        subtitulo: 'Mercado doméstico — B2B + categoría',
        color: '#c0392b',
        colorGlow: 'rgba(192,57,43,0.08)',
        colorBorder: 'rgba(192,57,43,0.25)',
        estado: 'activo',
        etiqueta: 'Activo',
        etiquetaColor: '#4ade80',
        kpis: [
            { label: 'Facturación mensual', valor: '€60K', meta: '→ €65K', semaforo: 'verde' },
            { label: 'Clientes B2B', valor: '~15', meta: '→ 30+', semaforo: 'amarillo' },
            { label: 'Leads activos', valor: '0', meta: '→ 50+', semaforo: 'rojo' },
            { label: 'Tráfico web', valor: '~500/m', meta: '→ 1.500', semaforo: 'amarillo' },
        ],
        acciones: [
            { urgencia: 'alta', texto: 'Activar HubSpot CRM — pipeline 0 leads sin trastienda' },
            { urgencia: 'alta', texto: 'Primer post TOFU esta semana en Instagram + LinkedIn' },
            { urgencia: 'media', texto: 'Lista 50 targets: 20 distrib. Vietnam + 20 Premium + 10 restaurantes' },
        ],
        descripcion: 'Mercado principal. Creación de categoría desde cero. Monoproducto 4 gamas (Vietnam · Premium · Club · Despieces). Objetivo: €720K run rate 2026.',
        progreso: 35,
        objetivo: '€720K',
        periodo: '2026',
    },
    {
        id: 'francia',
        bandera: '🇫🇷',
        nombre: 'Francia',
        subtitulo: 'Penetración — mercado x20 existente',
        color: '#2563eb',
        colorGlow: 'rgba(37,99,235,0.08)',
        colorBorder: 'rgba(37,99,235,0.25)',
        estado: 'expansion',
        etiqueta: 'Expansión',
        etiquetaColor: 'var(--brand)',
        kpis: [
            { label: 'Distribuidores FR', valor: '0', meta: '→ 2-3', semaforo: 'neutro' },
            { label: 'Mercado vs España', valor: 'x20', meta: 'Potencial', semaforo: 'verde' },
            { label: 'Presupuesto 90d', valor: '€3-5K', meta: 'Aprobado', semaforo: 'amarillo' },
            { label: 'Leads FR', valor: '0', meta: '→ 10+', semaforo: 'neutro' },
        ],
        acciones: [
            { urgencia: 'alta', texto: 'Investigar Top 50 distribuidores FR + 30 restaurantes grenouille' },
            { urgencia: 'alta', texto: 'LinkedIn FR activo: 2 posts/sem premium + despieces innovadores' },
            { urgencia: 'media', texto: 'Kit muestras premium + despieces a 5 distribuidores seleccionados' },
        ],
        descripcion: franciaData.narrativa + ' Francia YA consume rana. No necesita TOFU. Penetrar con Premium congelada + Despieces (no existen en FR). AquaPremium como Caballo de Troya.',
        progreso: 8,
        objetivo: '€50K',
        periodo: 'Q4 2026',
    },
    {
        id: 'petfood',
        bandera: '🐾',
        nombre: 'Petfood',
        subtitulo: 'Nuevo mercado — innovación pura',
        color: '#7c3aed',
        colorGlow: 'rgba(124,58,237,0.08)',
        colorBorder: 'rgba(124,58,237,0.25)',
        estado: 'exploracion',
        etiqueta: 'Exploración',
        etiquetaColor: 'var(--accent)',
        kpis: [
            { label: 'Estado', valor: 'Pre-seed', meta: '→ Piloto', semaforo: 'neutro' },
            { label: 'Oportunidad', valor: '€18B', meta: 'Mercado EU', semaforo: 'verde' },
            { label: 'Producto', valor: 'Proteína rana', meta: 'Sin competencia', semaforo: 'verde' },
            { label: 'Clientes beta', valor: '0', meta: '→ 3 marcas', semaforo: 'neutro' },
        ],
        acciones: [
            { urgencia: 'media', texto: 'Investigar requisitos proteína animal alternativa para petfood EU' },
            { urgencia: 'media', texto: 'Contactar 5 marcas premium petfood (Natural Greatness, Acana, etc.)' },
            { urgencia: 'baja', texto: 'Definir formato producto: harina de rana / snacks / wet food' },
        ],
        descripcion: 'Subproductos de rana (partes no comercializadas) convertidos en proteína premium para alimentación animal. Mercado EU de mascotas: €18B y creciendo. Sin competidor directo.',
        progreso: 5,
        objetivo: 'Piloto',
        periodo: '2027',
    },
]

// ─── Semáforo ─────────────────────────────────────────────────────────────────
const semaforoColor = {
    verde: 'var(--ok)',
    amarillo: 'var(--warn)',
    rojo: 'var(--alert)',
    neutro: 'var(--neutral)',
}

// ─── Componente MercadoKPI ────────────────────────────────────────────────────
function MercadoKPI({ kpi }) {
    const color = semaforoColor[kpi.semaforo] || '#6b7280'
    return (
        <div style={{
            padding: '10px 12px',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
        }}>
            <div style={{
                fontSize: '9px',
                color: 'var(--text-muted)',
                fontFamily: 'DM Mono, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
            }}>
                {kpi.label}
            </div>
            <div style={{
                fontSize: '18px',
                fontWeight: 700,
                fontFamily: 'Space Grotesk, sans-serif',
                color: color,
                lineHeight: 1.1,
            }}>
                {kpi.valor}
            </div>
            <div style={{
                fontSize: '9px',
                color: 'var(--text-faint)',
                fontFamily: 'DM Mono, monospace',
            }}>
                {kpi.meta}
            </div>
        </div>
    )
}

// ─── Componente Acción ────────────────────────────────────────────────────────
function AccionItem({ accion }) {
    const colorUrg = accion.urgencia === 'alta'
        ? 'var(--alert)'
        : accion.urgencia === 'media'
        ? 'var(--warn)'
        : 'var(--text-faint)'
    return (
        <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '6px 0',
            borderBottom: '1px solid var(--border)',
        }}>
            <span style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: colorUrg,
                flexShrink: 0,
                marginTop: '5px',
            }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {accion.texto}
            </span>
        </div>
    )
}

// ─── Componente MercadoCard ───────────────────────────────────────────────────
function MercadoCard({ mercado, isExpanded, onToggle, onNavegar }) {
    const progWidth = `${mercado.progreso}%`

    return (
        <div style={{
            background: `linear-gradient(135deg, ${mercado.colorGlow} 0%, var(--bg-card) 60%)`,
            border: `1px solid ${mercado.colorBorder}`,
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            transition: 'all 0.3s ease',
            cursor: 'default',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Barra de color lateral */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '3px',
                height: '100%',
                background: mercado.color,
                borderRadius: '3px 0 0 3px',
            }} />

            {/* Header del mercado */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px', lineHeight: 1 }}>{mercado.bandera}</span>
                    <div>
                        <div style={{
                            fontFamily: 'Space Grotesk, sans-serif',
                            fontSize: '18px',
                            fontWeight: 700,
                            color: 'var(--text-heading)',
                            lineHeight: 1.1,
                        }}>
                            {mercado.nombre}
                        </div>
                        <div style={{
                            fontSize: '10px',
                            color: 'var(--text-muted)',
                            fontFamily: 'DM Mono, monospace',
                            marginTop: '2px',
                        }}>
                            {mercado.subtitulo}
                        </div>
                    </div>
                </div>
                <span style={{
                    padding: '3px 8px',
                    borderRadius: '20px',
                    fontSize: '9px',
                    fontFamily: 'DM Mono, monospace',
                    fontWeight: 600,
                    background: `${mercado.etiquetaColor}18`,
                    color: mercado.etiquetaColor,
                    border: `1px solid ${mercado.etiquetaColor}33`,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                }}>
                    {mercado.etiqueta}
                </span>
            </div>

            {/* Descripción corta */}
            <div style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                borderLeft: `2px solid ${mercado.color}44`,
                paddingLeft: '10px',
            }}>
                {mercado.descripcion.length > 150
                    ? mercado.descripcion.slice(0, 150) + '…'
                    : mercado.descripcion}
            </div>

            {/* KPIs 2x2 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
            }}>
                {mercado.kpis.map((kpi, i) => (
                    <MercadoKPI key={i} kpi={kpi} />
                ))}
            </div>

            {/* Barra de progreso */}
            <div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                    fontSize: '9px',
                    fontFamily: 'DM Mono, monospace',
                    color: 'var(--text-faint)',
                }}>
                    <span>Progreso hacia objetivo</span>
                    <span style={{ color: mercado.color }}>
                        {mercado.objetivo} · {mercado.periodo}
                    </span>
                </div>
                <div style={{
                    height: '4px',
                    background: 'var(--border)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        height: '100%',
                        width: progWidth,
                        background: `linear-gradient(90deg, ${mercado.color}88, ${mercado.color})`,
                        borderRadius: '2px',
                        transition: 'width 1s ease',
                    }} />
                </div>
                <div style={{
                    fontSize: '9px',
                    color: 'var(--text-faint)',
                    fontFamily: 'DM Mono, monospace',
                    marginTop: '3px',
                    textAlign: 'right',
                }}>
                    {mercado.progreso}% completado
                </div>
            </div>

            {/* Acciones próximas (expandible) */}
            <div>
                <button
                    onClick={onToggle}
                    style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px 0',
                        color: 'var(--text-muted)',
                        fontSize: '10px',
                        fontFamily: 'DM Mono, monospace',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}
                >
                    <span>Próximas acciones ({mercado.acciones.length})</span>
                    <span style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                        ▾
                    </span>
                </button>

                {isExpanded && (
                    <div style={{ marginTop: '4px' }}>
                        {mercado.acciones.map((acc, i) => (
                            <AccionItem key={i} accion={acc} />
                        ))}
                    </div>
                )}
            </div>

            {/* Botón ir al módulo */}
            {onNavegar && (
                <button
                    onClick={onNavegar}
                    style={{
                        width: '100%',
                        padding: '8px',
                        background: `${mercado.color}15`,
                        border: `1px solid ${mercado.color}33`,
                        borderRadius: 'var(--radius-sm)',
                        color: mercado.color,
                        fontSize: '11px',
                        fontFamily: 'DM Mono, monospace',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'center',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = `${mercado.color}28`
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = `${mercado.color}15`
                    }}
                >
                    → Ver módulo {mercado.nombre}
                </button>
            )}
        </div>
    )
}

// ─── Dashboard principal ──────────────────────────────────────────────────────
export default function Dashboard({ cambiarVista }) {
    const [expandido, setExpandido] = useState(null)

    const today = new Date().toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    // KPIs globales rápidos
    const kpisVerde   = kpis.filter(k => k.semaforo === 'verde').length
    const kpisAmarillo = kpis.filter(k => k.semaforo === 'amarillo').length
    const kpisRojo    = kpis.filter(k => k.semaforo === 'rojo').length

    // Navegación a módulos
    const navegarMercado = {
        espana:  () => cambiarVista('espana'),
        francia: () => cambiarVista('francia'),
        petfood: () => cambiarVista('petfood'),
    }

    return (
        <div className="fade-in">

            {/* ── Header ── */}
            <div className="page-header">
                <div className="page-header-inner">
                    <div>
                        <h1 className="page-title">Centro de Mando</h1>
                        <div className="page-subtitle">
                            {empresa.nombre} · {today}
                        </div>
                    </div>
                    {/* Semáforo global */}
                    <div style={{
                        display: 'flex',
                        gap: '6px',
                        padding: '6px 12px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontFamily: 'DM Mono, monospace',
                        alignItems: 'center',
                    }}>
                        <span style={{ color: 'var(--ok)' }}>● {kpisVerde} ok</span>
                        <span style={{ color: 'var(--text-faint)' }}>·</span>
                        <span style={{ color: 'var(--warn)' }}>● {kpisAmarillo} alerta</span>
                        <span style={{ color: 'var(--text-faint)' }}>·</span>
                        <span style={{ color: 'var(--alert)' }}>● {kpisRojo} crítico</span>
                    </div>
                </div>
            </div>

            {/* ── Claim central ── */}
            <div style={{
                padding: '14px 20px',
                marginBottom: '28px',
                background: 'var(--brand-glow)',
                border: '1px solid var(--border-brand)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
            }}>
                <div>
                    <div style={{
                        fontFamily: 'Space Grotesk, sans-serif',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: 'var(--brand)',
                    }}>
                        🐸 "{empresa.mensajeCentral}"
                    </div>
                    <div style={{
                        fontSize: '10.5px',
                        color: 'var(--text-muted)',
                        marginTop: '3px',
                        fontFamily: 'DM Mono, monospace',
                    }}>
                        3 mercados activos · monoproducto 4 gamas · CEO + IA
                    </div>
                </div>
                {/* Resumen financiero rápido */}
                <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
                    {[
                        { label: 'Facturación 2025', val: '€379K', color: 'var(--brand)' },
                        { label: 'Run rate 2026', val: '€720K', color: 'var(--ok)' },
                        { label: 'Leads CRM', val: '0', color: 'var(--alert)' },
                    ].map(m => (
                        <div key={m.label} style={{
                            textAlign: 'center',
                            padding: '6px 10px',
                            background: 'var(--bg-elevated)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                        }}>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: m.color, fontFamily: 'Space Grotesk, sans-serif' }}>
                                {m.val}
                            </div>
                            <div style={{ fontSize: '8.5px', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace' }}>
                                {m.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Título sección mercados ── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
            }}>
                <div className="section-label" style={{ margin: 0 }}>Mercados activos</div>
                <div style={{
                    flex: 1,
                    height: '1px',
                    background: 'var(--border)',
                }} />
                <div style={{
                    fontSize: '9px',
                    fontFamily: 'DM Mono, monospace',
                    color: 'var(--text-faint)',
                }}>
                    3 territorios
                </div>
            </div>

            {/* ── Grid 3 mercados ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                marginBottom: '28px',
            }}>
                {mercados.map(mercado => (
                    <MercadoCard
                        key={mercado.id}
                        mercado={mercado}
                        isExpanded={expandido === mercado.id}
                        onToggle={() => setExpandido(expandido === mercado.id ? null : mercado.id)}
                        onNavegar={navegarMercado[mercado.id]}
                    />
                ))}
            </div>

            {/* ── Acción crítica global ── */}
            <div className="card card-sm card-warn">
                <div className="section-label">⚠ Acción más urgente ahora mismo</div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '20px', lineHeight: 1 }}>🔴</div>
                    <div>
                        <div style={{
                            fontFamily: 'Space Grotesk, sans-serif',
                            fontWeight: 600,
                            fontSize: '13px',
                            color: 'var(--text-heading)',
                            marginBottom: '4px',
                        }}>
                            Activar HubSpot CRM + publicar primer contenido TOFU esta semana
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            Sin CRM operativo, los 3 mercados son oportunidades invisibles. Los ~15 clientes actuales
                            no existen digitalmente. Los agentes de IA no tienen input para operar.
                            Tus leads = 0 en España, Francia y Petfood.
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}
