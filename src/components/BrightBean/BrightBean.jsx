import { useState, useEffect } from 'react'

const URL_DEFAULT = 'https://brightbean-studio-web-production-f14e.up.railway.app'   // se rellena tras el deploy en Railway

function useConexion(url) {
    const [estado, setEstado] = useState(url ? 'comprobando' : 'sin-url')
    useEffect(() => {
        if (!url) { setEstado('sin-url'); return }
        setEstado('comprobando')
        const img = new Image()
        const timeout = setTimeout(() => setEstado('offline'), 4000)
        img.onload  = () => { clearTimeout(timeout); setEstado('online') }
        img.onerror = () => { clearTimeout(timeout); setEstado('offline') }
        img.src = `${url}/favicon.ico?t=${Date.now()}`
        return () => clearTimeout(timeout)
    }, [url])
    return estado
}

const REDES = [
    { icon: '📸', nombre: 'Instagram', acciones: 'Publicar, Comentarios, DMs, Insights' },
    { icon: '💼', nombre: 'LinkedIn', acciones: 'Publicar (personal y empresa), Insights' },
    { icon: '🎵', nombre: 'TikTok', acciones: 'Publicar, Insights' },
    { icon: '📘', nombre: 'Facebook', acciones: 'Publicar, Comentarios, DMs, Insights' },
    { icon: '▶️', nombre: 'YouTube', acciones: 'Publicar, Comentarios, Insights' },
    { icon: '📌', nombre: 'Pinterest', acciones: 'Publicar, Insights' },
    { icon: '🧵', nombre: 'Threads', acciones: 'Publicar, Comentarios, Insights' },
    { icon: '🦋', nombre: 'Bluesky', acciones: 'Publicar, Comentarios' },
]

export default function BrightBean() {
    const [url, setUrl] = useState(
        () => localStorage.getItem('brightbean-url') || URL_DEFAULT
    )
    const [editando, setEditando] = useState(false)
    const [urlDraft, setUrlDraft] = useState(url)
    const conexion = useConexion(url)

    const guardarUrl = () => {
        const limpia = urlDraft.replace(/\/$/, '')
        setUrl(limpia)
        localStorage.setItem('brightbean-url', limpia)
        setEditando(false)
    }

    const estadoColor = {
        online: 'var(--ok)',
        offline: 'var(--alert)',
        comprobando: 'var(--warn)',
        'sin-url': 'var(--text-faint)',
    }[conexion]

    const estadoLabel = {
        online: 'Activo',
        offline: 'Sin conexion',
        comprobando: 'Comprobando...',
        'sin-url': 'URL no configurada',
    }[conexion]

    return (
        <div className="fade-in">

            {/* Header */}
            <div className="page-header">
                <div className="page-header-inner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '20px',
                        }}>📱</div>
                        <div>
                            <h1 className="page-title">BrightBean Studio</h1>
                            <div className="page-subtitle">
                                Redes sociales · Instagram · LinkedIn · TikTok · Facebook · YouTube · Pinterest
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Estado */}
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
                                background: estadoColor,
                                boxShadow: conexion === 'online' ? `0 0 6px ${estadoColor}` : 'none',
                            }} />
                            <span style={{ color: estadoColor }}>{estadoLabel}</span>
                        </div>

                        {/* Editar URL */}
                        <button
                            onClick={() => { setUrlDraft(url); setEditando(true) }}
                            style={{
                                padding: '6px 10px',
                                background: 'transparent',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-muted)',
                                fontSize: '11px',
                                fontFamily: 'DM Mono, monospace',
                                cursor: 'pointer',
                            }}
                            title="Cambiar URL del servidor"
                        >⚙ URL</button>
                    </div>
                </div>
            </div>

            {/* Modal editar URL */}
            {editando && (
                <div style={{
                    marginBottom: '16px',
                    padding: '16px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-brand)',
                    borderRadius: 'var(--radius-md)',
                }}>
                    <div style={{
                        fontSize: '12px', fontWeight: 600,
                        color: 'var(--text-heading)',
                        fontFamily: 'Space Grotesk, sans-serif',
                        marginBottom: '10px',
                    }}>URL de BrightBean Studio</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            value={urlDraft}
                            onChange={e => setUrlDraft(e.target.value)}
                            placeholder="https://brightbean-studio-xxx.up.railway.app"
                            onKeyDown={e => e.key === 'Enter' && guardarUrl()}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                background: 'var(--bg-base)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-heading)',
                                fontFamily: 'DM Mono, monospace',
                                fontSize: '12px',
                                outline: 'none',
                            }}
                        />
                        <button onClick={guardarUrl} style={{
                            padding: '8px 16px',
                            background: 'var(--brand-glow)',
                            border: '1px solid var(--border-brand)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--brand)',
                            fontSize: '12px',
                            fontFamily: 'DM Mono, monospace',
                            cursor: 'pointer',
                        }}>Guardar</button>
                        <button onClick={() => setEditando(false)} style={{
                            padding: '8px 12px',
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-muted)',
                            fontSize: '12px',
                            fontFamily: 'DM Mono, monospace',
                            cursor: 'pointer',
                        }}>Cancelar</button>
                    </div>
                    <div style={{
                        marginTop: '8px',
                        fontSize: '10.5px',
                        color: 'var(--text-faint)',
                        fontFamily: 'DM Mono, monospace',
                    }}>
                        Tras el deploy en Railway, copia la URL publica del servicio brightbean-studio-web aqui.
                    </div>
                </div>
            )}

            {/* Sin URL configurada */}
            {!url && !editando && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 320px',
                    gap: '16px',
                }}>
                    <div className="card">
                        <div style={{
                            padding: '24px',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
                            <div style={{
                                fontSize: '15px', fontWeight: 600,
                                color: 'var(--text-heading)',
                                fontFamily: 'Space Grotesk, sans-serif',
                                marginBottom: '8px',
                            }}>BrightBean Studio desplegado en Railway</div>
                            <div style={{ fontSize: '12px', marginBottom: '20px', lineHeight: 1.6 }}>
                                El deploy esta en curso. Cuando Railway termine,<br/>
                                copia la URL publica del servicio y configura abajo.
                            </div>
                            <button
                                onClick={() => { setUrlDraft(''); setEditando(true) }}
                                style={{
                                    padding: '10px 24px',
                                    background: 'var(--brand-glow)',
                                    border: '1px solid var(--border-brand)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--brand)',
                                    fontSize: '12px',
                                    fontFamily: 'DM Mono, monospace',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                }}
                            >Configurar URL de Railway</button>
                        </div>

                        <div style={{
                            marginTop: '16px',
                            padding: '12px 16px',
                            background: 'var(--bg-elevated)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                        }}>
                            <div className="section-label" style={{ marginBottom: '10px' }}>
                                Pasos tras el deploy
                            </div>
                            {[
                                'Railway termina el build (~3-5 min)',
                                'Ve a tu proyecto en railway.com',
                                'Copia la URL publica del servicio brightbean-studio-web',
                                'Pegala en el boton "Configurar URL" de arriba',
                                'Crea tu cuenta de admin en /setup',
                            ].map((paso, i) => (
                                <div key={i} style={{
                                    display: 'flex', gap: '10px',
                                    padding: '7px 0',
                                    borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                                    fontSize: '11.5px',
                                    color: 'var(--text-muted)',
                                }}>
                                    <span style={{
                                        flexShrink: 0,
                                        width: '18px', height: '18px',
                                        borderRadius: '50%',
                                        background: 'var(--brand-glow)',
                                        border: '1px solid var(--border-brand)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '10px', color: 'var(--brand)',
                                        fontFamily: 'DM Mono, monospace', fontWeight: 700,
                                    }}>{i + 1}</span>
                                    <span>{paso}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '12px' }}>
                            <a
                                href="https://railway.com"
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 14px',
                                    background: 'rgba(74,124,63,0.08)',
                                    border: '1px solid rgba(74,124,63,0.25)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--brand)',
                                    fontSize: '11px',
                                    fontFamily: 'DM Mono, monospace',
                                    textDecoration: 'none',
                                }}
                            >
                                <span>⬡ Ver proyecto en Railway</span>
                                <span>↗</span>
                            </a>
                        </div>
                    </div>

                    {/* Panel lateral: redes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="card card-sm">
                            <div className="section-label">Redes conectables</div>
                            {REDES.map((red, i) => (
                                <div key={i} style={{
                                    display: 'flex', gap: '10px',
                                    padding: '8px 0',
                                    borderBottom: i < REDES.length - 1 ? '1px solid var(--border)' : 'none',
                                }}>
                                    <span style={{ flexShrink: 0, fontSize: '14px' }}>{red.icon}</span>
                                    <div>
                                        <div style={{
                                            fontSize: '11px', fontWeight: 600,
                                            color: 'var(--text-heading)',
                                            fontFamily: 'Space Grotesk, sans-serif',
                                        }}>{red.nombre}</div>
                                        <div style={{
                                            fontSize: '10px', color: 'var(--text-faint)',
                                            fontFamily: 'DM Mono, monospace',
                                        }}>{red.acciones}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* App activa via iframe */}
            {url && !editando && (
                <div>
                    {conexion === 'offline' && (
                        <div style={{
                            marginBottom: '12px',
                            padding: '10px 14px',
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.25)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '11px',
                            color: 'var(--alert)',
                            fontFamily: 'DM Mono, monospace',
                        }}>
                            ✕ No se puede conectar con {url} — verifica que Railway este activo
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <a
                            href={url}
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
                        >↗ Abrir en pestana nueva</a>
                    </div>
                    <iframe
                        src={url}
                        title="BrightBean Studio"
                        style={{
                            width: '100%',
                            height: 'calc(100vh - 220px)',
                            minHeight: '520px',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-card)',
                        }}
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
                    />
                </div>
            )}
        </div>
    )
}
