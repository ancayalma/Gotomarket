const navGroups = [
    {
        label: 'MANDO',
        items: [
            { id: 'dashboard', icon: '▣', label: 'Centro de Mando' },
            { id: 'pipeline',  icon: '⇒', label: 'Pipeline' },
            { id: 'roadmap',   icon: '◈', label: 'Roadmap 90d' },
        ],
    },
    {
        label: 'MERCADOS',
        items: [
            { id: 'espana',     icon: '🇪🇸', label: 'España' },
            { id: 'francia',    icon: '🇫🇷', label: 'Francia ×20' },
            { id: 'petfood',    icon: '🐾', label: 'Petfood' },
            { id: 'contenidos', icon: '✦', label: 'Contenidos' },
        ],
    },
    {
        label: 'HERRAMIENTAS',
        items: [
            { id: 'brightbean', icon: '📱', label: 'Redes Sociales', badge: 'nuevo' },
            { id: 'chatwoot',   icon: '💬', label: 'Atención Cliente', badge: 'nuevo' },
        ],
    },
    {
        label: 'SISTEMA',
        items: [
            { id: 'conexiones', icon: '⬡', label: 'Conexiones', highlight: true },
            { id: 'stack',      icon: '◎', label: 'Stack Tech' },
            { id: 'prompt',     icon: '⊛', label: 'Prompt Maestro' },
        ],
    },
]

export default function Sidebar({ vistaActual, cambiarVista, tema, toggleTema }) {
    return (
        <nav className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-mark">
                    <div className="sidebar-logo-icon">🐸</div>
                    <div>
                        <div className="sidebar-logo-name">Grenoucerie</div>
                    </div>
                </div>
                <div className="sidebar-logo-tag">Operations Center v4.0</div>
            </div>

            {/* Nav */}
            <div className="sidebar-nav">
                {navGroups.map((group) => (
                    <div key={group.label}>
                        <p className="nav-group-label">{group.label}</p>
                        {group.items.map((item) => (
                            <button
                                key={item.id}
                                className={`nav-item ${vistaActual === item.id ? 'active' : ''}`}
                                onClick={() => cambiarVista(item.id)}
                                title={item.label}
                            >
                                <span className="nav-icon" style={{
                                    fontFamily: 'monospace',
                                    color: vistaActual === item.id
                                        ? 'var(--brand)'
                                        : item.highlight
                                        ? 'var(--accent)'
                                        : undefined
                                }}>
                                    {item.icon}
                                </span>
                                <span style={{
                                    color: item.highlight && vistaActual !== item.id
                                        ? 'var(--accent)'
                                        : undefined,
                                    flex: 1,
                                }}>
                                    {item.label}
                                </span>
                                {item.badge && vistaActual !== item.id && (
                                    <span style={{
                                        marginLeft: 'auto',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        fontSize: '8px',
                                        fontFamily: 'DM Mono, monospace',
                                        background: 'var(--brand-glow)',
                                        color: 'var(--brand)',
                                        border: '1px solid var(--border-brand)',
                                        fontWeight: 600,
                                        letterSpacing: '0.3px',
                                        flexShrink: 0,
                                    }}>
                                        {item.badge}
                                    </span>
                                )}
                                {item.highlight && (
                                    <span style={{
                                        marginLeft: 'auto',
                                        width: '5px', height: '5px',
                                        borderRadius: '50%',
                                        background: 'var(--warn)',
                                        boxShadow: '0 0 5px var(--warn)',
                                        flexShrink: 0,
                                    }} />
                                )}
                            </button>
                        ))}
                    </div>
                ))}
            </div>

            {/* Status footer */}
            <div className="sidebar-status">
                <div className="status-row">
                    <span className="status-dot" />
                    <span>SECRE online</span>
                </div>
                <div className="sidebar-kpis">
                    <div className="sidebar-kpi-row">
                        <span>Revenue YTD</span>
                        <span className="sidebar-kpi-val">€60K/m</span>
                    </div>
                    <div className="sidebar-kpi-row">
                        <span>Pipeline</span>
                        <span className="sidebar-kpi-val" style={{ color: 'var(--alert)' }}>0 leads</span>
                    </div>
                    <div className="sidebar-kpi-row">
                        <span>Clientes B2B</span>
                        <span className="sidebar-kpi-val">~15</span>
                    </div>
                </div>
                <div style={{
                    marginTop: '10px',
                    padding: '7px 9px',
                    background: 'var(--brand-glow)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-brand)',
                    fontSize: '9px',
                    color: 'var(--brand)',
                    fontFamily: 'DM Mono, monospace',
                    lineHeight: 1.5,
                }}>
                    "La carne más saludable del mundo"
                </div>

                {/* Enlace a plataforma CRM/WhatsApp */}
                <a
                    href="https://grenoucerie-platform.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 9px',
                        background: 'rgba(74,124,63,0.12)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(74,124,63,0.3)',
                        fontSize: '9px',
                        color: 'var(--brand)',
                        fontFamily: 'DM Mono, monospace',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                    }}
                >
                    <span>⚡ CRM / WhatsApp / Agentes</span>
                    <span>↗</span>
                </a>

                {/* Selector de Tema — pie del sidebar */}
                <div style={{ marginTop: '12px' }}>
                    <button
                        onClick={toggleTema}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '7px 0',
                            background: tema === 'oscuro' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            fontSize: '10px',
                            fontFamily: 'DM Mono, monospace',
                            color: 'var(--text-muted)',
                            letterSpacing: '0.5px',
                            transition: 'all 0.2s',
                        }}
                        title={tema === 'oscuro' ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
                    >
                        <span style={{ fontSize: '13px' }}>
                            {tema === 'oscuro' ? '☀️' : '🌙'}
                        </span>
                        {tema === 'oscuro' ? 'Activar modo día' : 'Activar modo noche'}
                    </button>
                </div>
            </div>
        </nav>
    )
}
