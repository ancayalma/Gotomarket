import { useState } from 'react'

// ── MAPA DE HERRAMIENTAS ─────────────────────────────────────
const categories = [
    {
        id: 'secre',
        label: 'SECRE — IA Asistente',
        desc: 'Asistente IA central ya operativa. Núcleo de coordinación.',
        tools: [
            {
                name: 'Claude / Cowork',
                icon: '🤖',
                status: 'online',
                desc: 'Asistente estratégico y operativo. Secre ya configurada y online.',
                action: null,
                url: 'https://claude.ai',
            },
            {
                name: 'Prompt Maestro v4',
                icon: '⊛',
                status: 'online',
                desc: 'Contexto completo de Grenoucerie embebido. CEO+CMO+COO en un sistema.',
                action: 'Ver prompt',
                internal: 'prompt',
            },
        ],
    },
    {
        id: 'crm',
        label: 'CRM & Pipeline',
        desc: 'Dato crítico: 0 leads registrados. Prioridad #1.',
        tools: [
            {
                name: 'HubSpot CRM',
                icon: '🎯',
                status: 'pending',
                desc: 'Pipeline multi-gama (Vietnam/Premium/Club/Despieces). Configurar gratis. ~15 clientes a cargar.',
                action: 'Activar ahora',
                url: 'https://hubspot.com',
                priority: true,
            },
            {
                name: 'LinkedIn Sales Nav.',
                icon: '💼',
                status: 'planned',
                desc: 'Prospección B2B. Mes 1-2. €80/mes. Prerequisito: CRM con datos.',
                action: null,
            },
        ],
    },
    {
        id: 'automatizacion',
        label: 'Automatización — n8n',
        desc: 'Workflows diseñados y listos. Esperan CRM con datos.',
        tools: [
            {
                name: 'n8n (self-hosted)',
                icon: '⚙',
                status: 'pending',
                desc: '6 workflows ya diseñados: prospección ICP, scoring, nurturing 72h, seguimiento, YouTube multiagente.',
                action: 'Ver workflows',
                internal: 'stack',
            },
            {
                name: 'WF1 — Prospección ICP',
                icon: '🔍',
                status: 'pending',
                desc: 'Identifica y enriquece targets por gama desde LinkedIn. Input: CRM limpio.',
                action: null,
            },
            {
                name: 'WF3 — Seguimiento 72h',
                icon: '⏱',
                status: 'pending',
                desc: 'Follow-up automático post-muestra. Input: HubSpot deal stage.',
                action: null,
            },
            {
                name: 'YouTube Multiagente',
                icon: '▶',
                status: 'pending',
                desc: '9 agentes especializados. Genera vídeos receta desde prompt → publica.',
                action: null,
            },
        ],
    },
    {
        id: 'email',
        label: 'Email & Comunicación',
        desc: 'Canal B2B + newsletter industria.',
        tools: [
            {
                name: 'Gmail',
                icon: '✉',
                status: 'online',
                desc: 'Email operativo conectado a SECRE. Lectura y borradores vía MCP.',
                action: null,
            },
            {
                name: 'Brevo (email mktg)',
                icon: '📧',
                status: 'planned',
                desc: 'Newsletter B2B mensual + nurturing leads. Gratis hasta 300/día.',
                action: 'Activar',
                url: 'https://brevo.com',
            },
        ],
    },
    {
        id: 'web',
        label: 'Web & SEO',
        desc: 'Web española en construcción. Francesa planificada.',
        tools: [
            {
                name: 'Web ES (grenoucerie)',
                icon: '🌐',
                status: 'pending',
                desc: 'Copy v1.0 listo (M5). Diseño en progreso. GA4 + Search Console pendiente.',
                action: null,
            },
            {
                name: 'Web FR (aquapremium)',
                icon: '🇫🇷',
                status: 'planned',
                desc: 'Activar cuando >5 clientes activos en FR. Narrativa M4 lista.',
                action: null,
            },
            {
                name: 'Google Analytics 4',
                icon: '📈',
                status: 'pending',
                desc: 'Tráfico web + atribución. Conectar a HubSpot para cerrar loop web→CRM.',
                action: 'Activar',
                url: 'https://analytics.google.com',
            },
            {
                name: 'Google Search Console',
                icon: '🔎',
                status: 'pending',
                desc: 'Tracking keywords "ancas de rana". Baseline pendiente.',
                action: 'Activar',
                url: 'https://search.google.com/search-console',
            },
        ],
    },
    {
        id: 'rrss',
        label: 'Redes Sociales',
        desc: 'Canal TOFU. Presencia actual débil.',
        tools: [
            {
                name: 'Instagram',
                icon: '📷',
                status: 'online',
                desc: '~1.043 seguidores. Activo pero irregular. Objetivo: 3-4x/sem TOFU.',
                action: null,
            },
            {
                name: 'LinkedIn (CEO Fabián)',
                icon: '🔗',
                status: 'pending',
                desc: 'Canal gratuito de autoridad. Actividad baja. Objetivo: 3x/sem MOFU B2B.',
                action: null,
                priority: true,
            },
            {
                name: 'LinkedIn FR',
                icon: '🔗',
                status: 'planned',
                desc: '2x/sem. Activar semana 7. Narrativa M4 Francia lista.',
                action: null,
            },
            {
                name: 'TikTok',
                icon: '🎵',
                status: 'planned',
                desc: 'Canal TOFU. Activar con YouTube multiagente funcionando.',
                action: null,
            },
            {
                name: 'YouTube',
                icon: '▶',
                status: 'planned',
                desc: 'Recetas MOFU. Activar cuando multiagente esté desplegado.',
                action: null,
            },
        ],
    },
    {
        id: 'datos',
        label: 'Datos & Reporting',
        desc: 'Sin datos no hay agentes. Infraestructura de madurez.',
        tools: [
            {
                name: 'HubSpot (reporting)',
                icon: '📊',
                status: 'pending',
                desc: 'Dashboard nativo. Activo cuando CRM tenga >20 leads.',
                action: null,
            },
            {
                name: 'Metabase',
                icon: '📉',
                status: 'planned',
                desc: 'BI open source sobre Supabase. Mes 3-6. Reemplaza Power BI a €0.',
                action: null,
            },
            {
                name: 'Google Alerts + n8n',
                icon: '🔔',
                status: 'planned',
                desc: 'Monitorización categoría "ancas de rana". Reemplaza Brandwatch (€1K/mes).',
                action: null,
            },
        ],
    },
]

const statusLabel = {
    online:  { text: 'ONLINE',   cls: 'online' },
    pending: { text: 'ACTIVAR',  cls: 'pending' },
    offline: { text: 'OFFLINE',  cls: 'offline' },
    planned: { text: 'PREVISTO', cls: 'planned' },
}

// Flujo de conexión visual
const connectionFlow = [
    { label: 'SECRE\n(Claude)', color: '#7eb356', key: 'secre' },
    { label: 'HubSpot\nCRM', color: '#c9a84c', key: 'crm' },
    { label: 'n8n\nWorkflows', color: '#6b8a5e', key: 'n8n' },
    { label: 'Gmail\nEmail', color: '#4ade80', key: 'email' },
    { label: 'Web +\nGA4', color: '#9ca3af', key: 'web' },
    { label: 'RRSS\nCanales', color: '#60a5fa', key: 'rrss' },
]

export default function Conexiones({ cambiarVista }) {
    const [expandedCat, setExpandedCat] = useState('crm')

    const total = categories.reduce((s, c) => s + c.tools.length, 0)
    const online = categories.reduce((s, c) => s + c.tools.filter(t => t.status === 'online').length, 0)
    const pending = categories.reduce((s, c) => s + c.tools.filter(t => t.status === 'pending').length, 0)

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="page-header">
                <div className="page-header-inner">
                    <div>
                        <h1 className="page-title">Ecosistema de Herramientas</h1>
                        <div className="page-subtitle">
                            {online} online · {pending} por activar · {total} herramientas mapeadas
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <span className="badge badge-ok">{online} ONLINE</span>
                        <span className="badge badge-warn">{pending} ACTIVAR</span>
                    </div>
                </div>
            </div>

            {/* Flujo de conexión */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="section-label">Flujo de datos — cómo se conectan</div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0',
                    overflowX: 'auto',
                    padding: '8px 0',
                }}>
                    {connectionFlow.map((node, i) => (
                        <div key={node.key} style={{ display: 'flex', alignItems: 'center', flex: '1 1 0', minWidth: '80px' }}>
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '5px',
                            }}>
                                <div style={{
                                    width: '44px', height: '44px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: `${node.color}18`,
                                    border: `1px solid ${node.color}44`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '18px',
                                }}>
                                    {node.key === 'secre' ? '🤖'
                                    : node.key === 'crm' ? '🎯'
                                    : node.key === 'n8n' ? '⚙'
                                    : node.key === 'email' ? '✉'
                                    : node.key === 'web' ? '🌐'
                                    : '📱'}
                                </div>
                                <div style={{
                                    fontSize: '9px',
                                    fontFamily: 'DM Mono, monospace',
                                    color: node.color,
                                    textAlign: 'center',
                                    whiteSpace: 'pre',
                                    lineHeight: 1.4,
                                }}>
                                    {node.label}
                                </div>
                            </div>
                            {i < connectionFlow.length - 1 && (
                                <div style={{
                                    width: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <div style={{
                                        width: '16px',
                                        height: '1px',
                                        background: 'var(--border-strong)',
                                    }} />
                                    <div style={{
                                        fontSize: '8px',
                                        color: 'var(--text-muted)',
                                        marginLeft: '-2px',
                                    }}>▶</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div style={{
                    marginTop: '10px',
                    fontSize: '9.5px',
                    color: 'var(--text-muted)',
                    fontFamily: 'DM Mono, monospace',
                    textAlign: 'center',
                }}>
                    SECRE orquesta · HubSpot centraliza datos · n8n automatiza · Gmail + web captan · RRSS generan demanda
                </div>
            </div>

            {/* Alerta CRM */}
            <div className="card card-warn" style={{ marginBottom: '20px', padding: '14px 18px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '18px' }}>⚠</span>
                    <div>
                        <div style={{
                            fontFamily: 'Space Grotesk, sans-serif',
                            fontWeight: 600,
                            fontSize: '13px',
                            color: 'var(--text-heading)',
                            marginBottom: '3px',
                        }}>
                            Bloqueante #1: HubSpot CRM no está activo
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            Sin CRM, el 80% de las herramientas no tienen datos que procesar.
                            Los workflows de n8n, el scoring de leads y los agentes necesitan HubSpot como fuente de verdad.
                            Es gratis. Se configura en 1 hora. Prioridad absoluta.
                        </div>
                    </div>
                    <a
                        href="https://hubspot.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none', flexShrink: 0 }}
                    >
                        <div className="btn btn-primary" style={{ fontSize: '11px' }}>
                            Activar HubSpot →
                        </div>
                    </a>
                </div>
            </div>

            {/* Categories accordion */}
            <div className="section-label">Herramientas por categoría</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {categories.map((cat) => (
                    <div key={cat.id} style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        transition: 'border-color 0.15s',
                        borderColor: expandedCat === cat.id ? 'var(--border-brand)' : undefined,
                    }}>
                        {/* Header */}
                        <button
                            onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                            style={{
                                width: '100%',
                                padding: '13px 16px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                                <div>
                                    <div style={{
                                        fontFamily: 'Space Grotesk, sans-serif',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: 'var(--text-heading)',
                                    }}>
                                        {cat.label}
                                    </div>
                                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        {cat.desc}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                <div style={{
                                    display: 'flex',
                                    gap: '4px',
                                }}>
                                    {cat.tools.map(t => (
                                        <div key={t.name} style={{
                                            width: '6px', height: '6px',
                                            borderRadius: '50%',
                                            background: t.status === 'online' ? 'var(--ok)'
                                                : t.status === 'pending' ? 'var(--warn)'
                                                : 'var(--text-faint)',
                                        }} />
                                    ))}
                                </div>
                                <span style={{
                                    fontSize: '12px',
                                    color: 'var(--text-muted)',
                                    transform: expandedCat === cat.id ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s',
                                    display: 'inline-block',
                                }}>▾</span>
                            </div>
                        </button>

                        {/* Tools */}
                        {expandedCat === cat.id && (
                            <div style={{
                                padding: '0 16px 14px',
                                borderTop: '1px solid var(--border)',
                            }}>
                                <div className="tool-grid" style={{ marginTop: '12px' }}>
                                    {cat.tools.map((tool) => {
                                        const st = statusLabel[tool.status]
                                        return (
                                            <div key={tool.name} className="tool-card" style={{
                                                borderColor: tool.priority ? 'var(--border-brand)' : undefined,
                                            }}>
                                                <div className="tool-card-head">
                                                    <span className="tool-name">{tool.name}</span>
                                                    <span className="tool-icon">{tool.icon}</span>
                                                </div>
                                                <div className="tool-desc">{tool.desc}</div>
                                                <div className="tool-status-row">
                                                    <span className={`tool-status ${st.cls}`}>
                                                        {st.text}
                                                    </span>
                                                    {tool.action && tool.url && (
                                                        <a
                                                            href={tool.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ textDecoration: 'none' }}
                                                        >
                                                            <div className="btn btn-secondary" style={{ fontSize: '10px', padding: '4px 10px' }}>
                                                                {tool.action} →
                                                            </div>
                                                        </a>
                                                    )}
                                                    {tool.action && tool.internal && (
                                                        <button
                                                            onClick={() => cambiarVista && cambiarVista(tool.internal)}
                                                            className="btn btn-secondary"
                                                            style={{ fontSize: '10px', padding: '4px 10px' }}
                                                        >
                                                            {tool.action} →
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Plan de activación */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div className="section-label">Secuencia de activación — por semana</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {[
                        {
                            week: 'S1',
                            items: ['HubSpot CRM: crear cuenta, propiedades multi-gama (Vietnam/Premium/Club/Despieces), pipeline 6 fases', 'Cargar ~15 clientes actuales con gama, volumen, contacto', 'GA4 + Search Console: activar en web'],
                            color: 'var(--alert)',
                        },
                        {
                            week: 'S2',
                            items: ['Web → HubSpot: formulario conectado (leads inyectan en CRM con fuente + gama)', 'LinkedIn CEO: 1er post TOFU publicado', 'Gmail ↔ SECRE: flujo de seguimiento commercial activo'],
                            color: 'var(--warn)',
                        },
                        {
                            week: 'S3-4',
                            items: ['n8n: desplegar WF3 seguimiento 72h sobre HubSpot (ya tiene datos)', 'Brevo: configurar newsletter mensual B2B', 'Instagram: calendario editorial activo (3x/sem)'],
                            color: 'var(--accent)',
                        },
                        {
                            week: 'Mes 2',
                            items: ['n8n WF1: prospección ICP con LinkedIn Sales Nav.', 'YouTube multiagente: primer vídeo receta generado', 'HubSpot reporting: dashboard real con datos reales'],
                            color: 'var(--brand)',
                        },
                        {
                            week: 'Mes 3+',
                            items: ['RAG Grenoucerie: documentación centralizada + base de conocimiento', 'Metabase BI sobre datos reales', 'LinkedIn FR + web FR si >5 clientes Francia'],
                            color: 'var(--text-muted)',
                        },
                    ].map((phase, i) => (
                        <div key={i} className="stack-row">
                            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', width: '100%' }}>
                                <div style={{
                                    fontFamily: 'DM Mono, monospace',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    color: phase.color,
                                    minWidth: '36px',
                                    paddingTop: '2px',
                                }}>
                                    {phase.week}
                                </div>
                                <div style={{ flex: 1 }}>
                                    {phase.items.map((item, j) => (
                                        <div key={j} style={{
                                            fontSize: '11.5px',
                                            color: 'var(--text-body)',
                                            lineHeight: 1.5,
                                            paddingLeft: '10px',
                                            borderLeft: `2px solid ${j === 0 ? phase.color : 'transparent'}`,
                                            marginBottom: '3px',
                                        }}>
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
