import { useState, useEffect } from 'react'

// ─── Estado de conexión ───────────────────────────────────────────────────────
function useConexion(url) {
    const [estado, setEstado] = useState('comprobando')

    useEffect(() => {
        const img = new Image()
        const timeout = setTimeout(() => setEstado('offline'), 3000)
        img.onload  = () => { clearTimeout(timeout); setEstado('online') }
        img.onerror = () => { clearTimeout(timeout); setEstado('offline') }
        img.src = `${url}/favicon.ico?t=${Date.now()}`
        return () => clearTimeout(timeout)
    }, [url])

    return estado
}

// ─── Paso de instalación ──────────────────────────────────────────────────────
function PasoInstalacion({ numero, titulo, comandos, nota }) {
    return (
        <div style={{
            padding: '14px 16px',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            marginBottom: '10px',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: comandos ? '10px' : 0,
            }}>
                <span style={{
                    width: '22px', height: '22px',
                    borderRadius: '50%',
                    background: 'rgba(37,99,235,0.1)',
                    border: '1px solid rgba(37,99,235,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', color: '#60a5fa',
                    fontFamily: 'DM Mono, monospace', fontWeight: 700, flexShrink: 0,
                }}>
                    {numero}
                </span>
                <span style={{
                    fontSize: '12px', fontWeight: 600,
                    color: 'var(--text-heading)',
                    fontFamily: 'Space Grotesk, sans-serif',
                }}>
                    {titulo}
                </span>
            </div>
            {comandos && comandos.map((cmd, i) => (
                <div key={i} style={{
                    padding: '8px 12px',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '11px',
                    color: 'var(--pistacho)',
                    marginBottom: '4px',
                    userSelect: 'all',
                }}>
                    $ {cmd}
                </div>
            ))}
            {nota && (
                <div style={{
                    marginTop: '8px', fontSize: '10.5px',
                    color: 'var(--text-muted)', fontStyle: 'italic',
                }}>
                    💡 {nota}
                </div>
            )}
        </div>
    )
}

// ─── Canal de soporte ─────────────────────────────────────────────────────────
function Canal({ icono, nombre, descripcion }) {
    return (
        <div style={{
            display: 'flex', gap: '10px', alignItems: 'center',
            padding: '10px 0', borderBottom: '1px solid var(--border)',
        }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{icono}</span>
            <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-heading)' }}>
                    {nombre}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {descripcion}
                </div>
            </div>
        </div>
    )
}

// ─── Panel principal Chatwoot ─────────────────────────────────────────────────
const URL_CHATWOOT = 'http://localhost:3000'

export default function Chatwoot() {
    const conexion = useConexion(URL_CHATWOOT)
    const [pestana, setPestana] = useState('instalacion')

    const online = conexion === 'online'

    return (
        <div className="fade-in">

            {/* ── Header ── */}
            <div className="page-header">
                <div className="page-header-inner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '20px',
                        }}>
                            💬
                        </div>
                        <div>
                            <h1 className="page-title">Chatwoot</h1>
                            <div className="page-subtitle">
                                Atención al cliente omnicanal · Alternativa a Intercom / Zendesk
                            </div>
                        </div>
                    </div>
                    {/* Estado de conexión */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 12px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontFamily: 'DM Mono, monospace',
                    }}>
                        <span style={{
                            width: '7px', height: '7px', borderRadius: '50%',
                            background: online ? 'var(--ok)' : conexion === 'comprobando' ? 'var(--warn)' : 'var(--alert)',
                            boxShadow: online ? '0 0 6px var(--ok)' : 'none',
                        }} />
                        <span style={{ color: online ? 'var(--ok)' : 'var(--text-muted)' }}>
                            {online ? 'Servidor activo' : conexion === 'comprobando' ? 'Comprobando…' : 'Servidor inactivo'}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Pestañas ── */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
                {[
                    { id: 'instalacion', label: '⚙ Instalación', disabled: false },
                    { id: 'app', label: '🚀 Abrir herramienta', disabled: !online },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => !tab.disabled && setPestana(tab.id)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: 'var(--radius-sm)',
                            border: `1px solid ${pestana === tab.id ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
                            background: pestana === tab.id ? 'rgba(59,130,246,0.08)' : 'transparent',
                            color: pestana === tab.id ? '#60a5fa' : tab.disabled ? 'var(--text-faint)' : 'var(--text-muted)',
                            fontSize: '12px',
                            cursor: tab.disabled ? 'not-allowed' : 'pointer',
                            fontFamily: 'DM Mono, monospace',
                            transition: 'all 0.2s',
                        }}
                    >
                        {tab.label}
                        {tab.id === 'app' && !online && (
                            <span style={{ marginLeft: '6px', fontSize: '9px', color: 'var(--alert)' }}>
                                (requiere instalación)
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Contenido: Instalación ── */}
            {pestana === 'instalacion' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>

                    {/* Pasos */}
                    <div>
                        <div className="card" style={{ marginBottom: '16px' }}>
                            <div className="section-label">¿Qué es Chatwoot?</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                Plataforma open-source para gestionar la atención al cliente desde{' '}
                                <strong style={{ color: 'var(--text-heading)' }}>
                                    WhatsApp, web chat, email, Instagram, Telegram y más
                                </strong>
                                {' '}en una sola bandeja de entrada. Incluye IA para respuestas automáticas (Captain).
                            </div>
                            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {['WhatsApp', 'Web Chat', 'Email', 'Instagram', 'Telegram', 'Twitter', 'SMS', 'Facebook'].map(canal => (
                                    <span key={canal} style={{
                                        padding: '3px 8px',
                                        background: 'var(--brand-glow)',
                                        border: '1px solid var(--border-brand)',
                                        borderRadius: '20px',
                                        fontSize: '10px',
                                        color: 'var(--brand)',
                                        fontFamily: 'DM Mono, monospace',
                                    }}>
                                        {canal}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="section-label" style={{ marginBottom: '12px' }}>
                            Instalación con Docker (recomendado para Chatwoot)
                        </div>

                        <div style={{
                            padding: '12px 16px',
                            background: 'rgba(251,191,36,0.06)',
                            border: '1px solid rgba(251,191,36,0.2)',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: '12px',
                            fontSize: '11.5px',
                            color: 'var(--warn)',
                            fontFamily: 'DM Mono, monospace',
                        }}>
                            ⚠ Chatwoot requiere Docker Desktop. Descárgalo gratis en{' '}
                            <a href="https://www.docker.com/products/docker-desktop/"
                               target="_blank" rel="noreferrer"
                               style={{ color: '#60a5fa' }}>
                                docker.com
                            </a>
                        </div>

                        <PasoInstalacion
                            numero="1"
                            titulo="Instalar Docker Desktop"
                            nota="Descarga Docker Desktop para Windows desde docker.com → instalar → reiniciar el PC si lo pide."
                        />
                        <PasoInstalacion
                            numero="2"
                            titulo="Descargar Chatwoot"
                            comandos={[
                                'git clone https://github.com/chatwoot/chatwoot.git',
                                'cd chatwoot',
                                'copy .env.example .env',
                            ]}
                        />
                        <PasoInstalacion
                            numero="3"
                            titulo="Arrancar con Docker"
                            comandos={[
                                'docker compose up -d',
                                'docker compose exec rails bundle exec rails db:chatwoot_prepare',
                            ]}
                            nota="El primer arranque tarda 5-10 minutos mientras descarga todo."
                        />
                        <PasoInstalacion
                            numero="4"
                            titulo="Acceder y configurar"
                            nota="Abre http://localhost:3000 → crea tu cuenta de administrador → configura tu primer canal (WhatsApp o web chat)."
                        />

                        <div style={{
                            padding: '12px 16px',
                            background: 'var(--ok-bg)',
                            border: '1px solid rgba(74,222,128,0.2)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '11px',
                            color: 'var(--ok)',
                            fontFamily: 'DM Mono, monospace',
                        }}>
                            ✓ Una vez instalado, visita{' '}
                            <a href="http://localhost:3000" target="_blank" rel="noreferrer"
                               style={{ color: 'var(--brand)' }}>
                                http://localhost:3000
                            </a>
                            {' '}para gestionar toda la atención al cliente de Grenoucerie.
                        </div>
                    </div>

                    {/* Info lateral */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="card card-sm">
                            <div className="section-label">Canales para Grenoucerie</div>
                            <Canal icono="💬" nombre="Web Chat" descripcion="Botón de chat en tu web — clientes pueden preguntar en tiempo real" />
                            <Canal icono="📱" nombre="WhatsApp" descripcion="Gestionar WhatsApp de empresa desde el ordenador" />
                            <Canal icono="📧" nombre="Email" descripcion="Recibir consultas por email como tickets organizados" />
                            <Canal icono="📸" nombre="Instagram" descripcion="Responder DMs de Instagram desde Chatwoot" />
                            <Canal icono="🤖" nombre="IA (Captain)" descripcion="Respuestas automáticas a preguntas frecuentes sobre productos" />
                        </div>

                        <div className="card card-sm">
                            <div className="section-label">Alternativas que reemplaza</div>
                            {[
                                { nombre: 'Intercom', precio: '$74/mes' },
                                { nombre: 'Zendesk', precio: '$55/mes' },
                                { nombre: 'Freshdesk', precio: '$35/mes' },
                                { nombre: 'Tidio', precio: '$29/mes' },
                            ].map((alt, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    padding: '7px 0',
                                    borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
                                    fontSize: '11px',
                                }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{alt.nombre}</span>
                                    <span style={{
                                        fontFamily: 'DM Mono, monospace', fontSize: '10px',
                                        color: 'var(--alert)', textDecoration: 'line-through',
                                    }}>{alt.precio}</span>
                                </div>
                            ))}
                            <div style={{
                                marginTop: '10px', padding: '8px',
                                background: 'var(--brand-glow)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-brand)',
                                textAlign: 'center', fontSize: '12px',
                                color: 'var(--brand)', fontWeight: 700,
                                fontFamily: 'Space Grotesk, sans-serif',
                            }}>
                                Chatwoot → €0/mes
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Contenido: App (iframe) ── */}
            {pestana === 'app' && online && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <a
                            href={URL_CHATWOOT}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                padding: '6px 12px',
                                background: 'rgba(37,99,235,0.08)',
                                border: '1px solid rgba(37,99,235,0.3)',
                                borderRadius: 'var(--radius-sm)',
                                color: '#60a5fa', fontSize: '11px',
                                fontFamily: 'DM Mono, monospace',
                                textDecoration: 'none',
                            }}
                        >
                            ↗ Abrir en pestaña nueva
                        </a>
                    </div>
                    <iframe
                        src={URL_CHATWOOT}
                        title="Chatwoot"
                        style={{
                            width: '100%',
                            height: 'calc(100vh - 240px)',
                            minHeight: '500px',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-card)',
                        }}
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                    />
                </div>
            )}
        </div>
    )
}
