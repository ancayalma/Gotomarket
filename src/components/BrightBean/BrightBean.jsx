import { useState, useEffect } from 'react'

// ─── Estado de conexión de la herramienta ─────────────────────────────────────
function useConexion(url) {
    const [estado, setEstado] = useState('comprobando') // 'online' | 'offline' | 'comprobando'

    useEffect(() => {
        const img = new Image()
        const timeout = setTimeout(() => setEstado('offline'), 3000)

        img.onload = () => {
            clearTimeout(timeout)
            setEstado('online')
        }
        img.onerror = () => {
            clearTimeout(timeout)
            setEstado('offline')
        }
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
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'var(--brand-glow)',
                    border: '1px solid var(--border-brand)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    color: 'var(--brand)',
                    fontFamily: 'DM Mono, monospace',
                    fontWeight: 700,
                    flexShrink: 0,
                }}>
                    {numero}
                </span>
                <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
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
                    letterSpacing: '0.2px',
                    userSelect: 'all',
                }}>
                    $ {cmd}
                </div>
            ))}
            {nota && (
                <div style={{
                    marginTop: '8px',
                    fontSize: '10.5px',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                }}>
                    💡 {nota}
                </div>
            )}
        </div>
    )
}

// ─── Panel principal BrightBean Studio ───────────────────────────────────────
const URL_BRIGHTBEAN = 'http://localhost:8001'

export default function BrightBean() {
    const conexion = useConexion(URL_BRIGHTBEAN)
    const [pestana, setPestana] = useState('instalacion') // 'instalacion' | 'app'

    const online = conexion === 'online'

    return (
        <div className="fade-in">

            {/* ── Header ── */}
            <div className="page-header">
                <div className="page-header-inner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                        }}>
                            📱
                        </div>
                        <div>
                            <h1 className="page-title">BrightBean Studio</h1>
                            <div className="page-subtitle">
                                Gestión de redes sociales · Alternativa open-source a Buffer / SocialPilot
                            </div>
                        </div>
                    </div>
                    {/* Estado de conexión */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontFamily: 'DM Mono, monospace',
                    }}>
                        <span style={{
                            width: '7px', height: '7px',
                            borderRadius: '50%',
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
                            border: `1px solid ${pestana === tab.id ? 'var(--border-brand)' : 'var(--border)'}`,
                            background: pestana === tab.id ? 'var(--brand-glow)' : 'transparent',
                            color: pestana === tab.id ? 'var(--brand)' : tab.disabled ? 'var(--text-faint)' : 'var(--text-muted)',
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

                    {/* Pasos de instalación */}
                    <div>
                        <div className="card" style={{ marginBottom: '16px' }}>
                            <div className="section-label">¿Qué es BrightBean Studio?</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                Plataforma open-source para gestionar todas tus redes sociales desde un solo lugar.
                                Programa publicaciones, aprueba contenido y analiza resultados en{' '}
                                <strong style={{ color: 'var(--text-heading)' }}>
                                    Instagram, LinkedIn, TikTok, Facebook, YouTube, Pinterest y más
                                </strong>
                                {' '}— sin límite de cuentas ni pago mensual.
                            </div>
                            <div style={{
                                marginTop: '12px',
                                display: 'flex',
                                gap: '8px',
                                flexWrap: 'wrap',
                            }}>
                                {['Instagram', 'LinkedIn', 'TikTok', 'Facebook', 'YouTube', 'Pinterest', 'Threads', 'Bluesky'].map(red => (
                                    <span key={red} style={{
                                        padding: '3px 8px',
                                        background: 'var(--brand-glow)',
                                        border: '1px solid var(--border-brand)',
                                        borderRadius: '20px',
                                        fontSize: '10px',
                                        color: 'var(--brand)',
                                        fontFamily: 'DM Mono, monospace',
                                    }}>
                                        {red}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="section-label" style={{ marginBottom: '12px' }}>
                            Instalación paso a paso (sin Docker)
                        </div>

                        <PasoInstalacion
                            numero="1"
                            titulo="Instalar Python 3.12 (si no lo tienes)"
                            nota="Descarga desde python.org → Windows installer. Marca 'Add Python to PATH' al instalar."
                        />
                        <PasoInstalacion
                            numero="2"
                            titulo="Descargar el proyecto"
                            comandos={[
                                'git clone https://github.com/brightbeanxyz/brightbean-studio.git',
                                'cd brightbean-studio',
                                'copy .env.example .env',
                            ]}
                            nota="Si no tienes Git, también puedes descargar el ZIP desde GitHub."
                        />
                        <PasoInstalacion
                            numero="3"
                            titulo="Configurar base de datos (SQLite — sin instalar nada)"
                            nota="Abre el archivo .env con el Bloc de Notas y cambia DATABASE_URL=sqlite:///db.sqlite3"
                        />
                        <PasoInstalacion
                            numero="4"
                            titulo="Instalar dependencias y arrancar"
                            comandos={[
                                'python -m venv .venv',
                                '.venv\\Scripts\\activate',
                                'pip install -r requirements.txt',
                                'python manage.py migrate',
                                'python manage.py createsuperuser',
                                'python manage.py runserver',
                            ]}
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
                            <a href="http://localhost:8000" target="_blank" rel="noreferrer"
                               style={{ color: 'var(--brand)' }}>
                                http://localhost:8000
                            </a>
                            {' '}e inicia sesión con tu usuario creado.
                        </div>
                    </div>

                    {/* Info lateral */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="card card-sm">
                            <div className="section-label">Para qué lo usarás</div>
                            {[
                                { icono: '📅', texto: 'Programar posts para Instagram, LinkedIn y TikTok de Grenoucerie' },
                                { icono: '✅', texto: 'Aprobar contenido antes de publicar' },
                                { icono: '📊', texto: 'Ver qué contenidos funcionan mejor' },
                                { icono: '🌍', texto: 'Gestionar cuentas de España Y Francia desde un mismo lugar' },
                                { icono: '🤖', texto: 'Integrar con tus flujos de IA para contenido automático' },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    gap: '10px',
                                    padding: '8px 0',
                                    borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                                    fontSize: '11.5px',
                                    color: 'var(--text-muted)',
                                    lineHeight: 1.4,
                                }}>
                                    <span style={{ flexShrink: 0 }}>{item.icono}</span>
                                    <span>{item.texto}</span>
                                </div>
                            ))}
                        </div>

                        <div className="card card-sm">
                            <div className="section-label">Alternativas que reemplaza</div>
                            {[
                                { nombre: 'Buffer', precio: '$60/mes' },
                                { nombre: 'SocialPilot', precio: '$86/mes' },
                                { nombre: 'Sendible', precio: '$89/mes' },
                                { nombre: 'ContentStudio', precio: '$49/mes' },
                            ].map((alt, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '7px 0',
                                    borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
                                    fontSize: '11px',
                                }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{alt.nombre}</span>
                                    <span style={{
                                        fontFamily: 'DM Mono, monospace',
                                        fontSize: '10px',
                                        color: 'var(--alert)',
                                        textDecoration: 'line-through',
                                    }}>{alt.precio}</span>
                                </div>
                            ))}
                            <div style={{
                                marginTop: '10px',
                                padding: '8px',
                                background: 'var(--brand-glow)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-brand)',
                                textAlign: 'center',
                                fontSize: '12px',
                                color: 'var(--brand)',
                                fontWeight: 700,
                                fontFamily: 'Space Grotesk, sans-serif',
                            }}>
                                BrightBean Studio → €0/mes
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Contenido: App (iframe) ── */}
            {pestana === 'app' && online && (
                <div style={{ position: 'relative' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginBottom: '8px',
                    }}>
                        <a
                            href={URL_BRIGHTBEAN}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                padding: '6px 12px',
                                background: 'var(--brand-glow)',
                                border: '1px solid var(--border-brand)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--brand)',
                                fontSize: '11px',
                                fontFamily: 'DM Mono, monospace',
                                textDecoration: 'none',
                            }}
                        >
                            ↗ Abrir en pestaña nueva
                        </a>
                    </div>
                    <iframe
                        src={URL_BRIGHTBEAN}
                        title="BrightBean Studio"
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
