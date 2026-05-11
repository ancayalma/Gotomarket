// Visor Prompt Maestro v4.0 — actualizado con corrección estratégica
import { promptMaestro, gamas, embudo } from '../../data/grenoucerie'
import { useState } from 'react'

export default function Prompt() {
    const [copiado, setCopiado] = useState(false)

    const copiarPrompt = () => {
        navigator.clipboard.writeText(promptMaestro).then(() => {
            setCopiado(true)
            setTimeout(() => setCopiado(false), 2000)
        })
    }

    return (
        <div>
            <div className="page-header">
                <h2>🤖 Prompt Maestro v4.0</h2>
                <p>Actualizado con corrección estratégica: monoproducto 4 gamas, embudo de categoría, generación de mercado</p>
            </div>

            {/* Qué cambió de v3 a v4 */}
            <div className="card" style={{
                marginBottom: '24px',
                borderColor: 'rgba(255, 193, 7, 0.3)',
                background: 'rgba(255, 193, 7, 0.04)',
                padding: '14px 20px',
            }}>
                <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px', color: 'var(--amarillo)' }}>
                    ⚡ Qué cambió en v4.0 vs v3.0
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    • Monoproducto con 4 gamas (Vietnam / Premium / Club / Despieces)<br />
                    • Embudo de CATEGORÍA, no de marca (TOFU = "que suene la rana")<br />
                    • Mensaje central: "La carne más saludable del mundo"<br />
                    • Generar mercado nuevo, no competir por existente<br />
                    • Francia = penetrar mercado existente x20 con formatos nuevos<br />
                    • B2C real: amas de casa, salud, consumidor final
                </div>
            </div>

            {/* Roles */}
            <div className="grid-3" style={{ marginBottom: '24px' }}>
                {[
                    {
                        rol: 'CEO VISIONARIO', color: 'var(--pistacho)', icono: '👤',
                        descripcion: 'Priorización recursos, go-to-market, fusión, relaciones grupo',
                        ultima: 'Presupuesto, entrada mercados, AquaPremium'
                    },
                    {
                        rol: 'CMO ARQUITECTO', color: 'var(--oliva-light)', icono: '🏗️',
                        descripcion: 'Narrativa de categoría, embudo, demanda multi-target',
                        ultima: 'Posicionamiento, mensaje categoría, contenido por nivel'
                    },
                    {
                        rol: 'COO EJECUTOR', color: 'var(--salvia)', icono: '⚙️',
                        descripcion: 'Procesos multi-gama, métricas, stack, operaciones',
                        ultima: 'CRM, cadencia, reporting por gama'
                    },
                ].map((r, i) => (
                    <div key={i} className="card card-sm" style={{ borderTop: `2px solid ${r.color}` }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>{r.icono}</div>
                        <div style={{ fontWeight: 700, fontSize: '11px', color: r.color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{r.rol}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '8px' }}>{r.descripcion}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Última palabra: {r.ultima}</div>
                    </div>
                ))}
            </div>

            {/* Contexto clave embebido */}
            <div className="section-title">Contexto Clave del Prompt</div>
            <div className="grid-4" style={{ marginBottom: '24px' }}>
                {gamas.map(g => (
                    <div key={g.id} className="card card-sm" style={{ borderTop: `2px solid ${g.color}`, textAlign: 'center' }}>
                        <div style={{ fontSize: '20px' }}>{g.emoji}</div>
                        <div style={{ fontWeight: 700, fontSize: '11px', color: g.color, marginTop: '4px' }}>{g.nombre}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Ratio: {g.ratio}</div>
                    </div>
                ))}
            </div>

            {/* Ejemplo conflicto */}
            <div className="card" style={{
                marginBottom: '24px',
                borderColor: 'rgba(186, 184, 108, 0.3)',
                background: 'rgba(186, 184, 108, 0.04)',
            }}>
                <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '13px' }}>⚔️ Ejemplo de Conflicto v4.0</div>
                <div className="prompt-block" style={{ maxHeight: '100px', fontSize: '11px' }}>
                    {`⚔️ CONFLICTO: CEO quiere empujar venta Premium en Francia YA (presión grupo).
CMO recomienda: primero Vietnam como puerta de entrada (los distribuidores FR
ya manejan rana importada — es terreno conocido para ellos).
Recomendación: VIETNAM primero en FR. Es más fácil entrar con un producto que
ya conocen que intentar educarles sobre premium de entrada. Una vez dentro con
Vietnam, presentar premium + despieces como "upgrade".`}
                </div>
            </div>

            {/* Prompt completo */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div className="section-title">Prompt Completo v4.0</div>
                <button
                    className={`btn ${copiado ? 'btn-primary' : 'btn-outline'}`}
                    onClick={copiarPrompt}
                    style={{ padding: '6px 16px', fontSize: '12px' }}
                >
                    {copiado ? '✓ Copiado!' : '📋 Copiar prompt'}
                </button>
            </div>
            <div className="prompt-block">{promptMaestro}</div>

            {/* Guía de uso */}
            <div style={{ marginTop: '24px' }}>
                <div className="section-title">Cómo Usar Este Prompt</div>
                <div className="card">
                    {[
                        { paso: '1', instruccion: 'Copia el prompt v4.0 con el botón de arriba' },
                        { paso: '2', instruccion: 'Pégalo al inicio de cada nueva conversación con IA (Claude, ChatGPT, Gemini)' },
                        { paso: '3', instruccion: 'Adjunta Ecosistema_v3.md cuando necesites referencia completa' },
                        { paso: '4', instruccion: 'Especifica siempre la GAMA y el NIVEL DE EMBUDO (TOFU/MOFU/BOFU)' },
                        { paso: '5', instruccion: 'Para contenido: indica si es para hostelero, consumidor, ama de casa o salud' },
                    ].map((p, i) => (
                        <div key={i} style={{
                            display: 'flex', gap: '12px', padding: '10px 0',
                            borderBottom: i < 4 ? '1px solid rgba(147, 197, 114, 0.06)' : 'none',
                            alignItems: 'flex-start',
                        }}>
                            <span style={{
                                minWidth: '24px', height: '24px', borderRadius: '50%',
                                background: 'rgba(147, 197, 114, 0.15)', color: 'var(--pistacho)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '11px', fontWeight: 700,
                            }}>{p.paso}</span>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{p.instruccion}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
