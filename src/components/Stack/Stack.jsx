// Vista del Stack Tecnológico + Arquitectura Agéntica v2.0
import { useState } from 'react'
import { stackPorFase, agentesPrioritarios, presupuestoComparativo, roadmapAgentes, riesgosStack } from '../../data/stack_agentico'

export default function Stack() {
    const [tab, setTab] = useState('herramientas')

    const totalToolsF1 = stackPorFase[0].capas.reduce((sum, c) => sum + c.tools.length, 0)
    const totalToolsF2 = stackPorFase[1].capas.reduce((sum, c) => sum + c.tools.length, 0)
    const totalToolsF3 = stackPorFase[2].capas.reduce((sum, c) => sum + c.tools.length, 0)

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2>⚙️ Stack Tecnológico & Arquitectura Agéntica</h2>
                    <p>De €50.400/año a {'<'}€3.000/año (ahorro 94%) · n8n como hub central · 6 agentes prioritarios</p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button className={tab === 'herramientas' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTab('herramientas')}>🧰 Herramientas</button>
                    <button className={tab === 'agentes' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTab('agentes')}>🤖 Agentes</button>
                    <button className={tab === 'roadmap' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTab('roadmap')}>🗓️ Roadmap</button>
                    <button className={tab === 'presupuesto' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTab('presupuesto')}>💰 Presupuesto</button>
                </div>
            </div>

            {/* ==== HERRAMIENTAS ==== */}
            {tab === 'herramientas' && (
                <div>
                    {/* Cards resumen de fases */}
                    <div className="grid-3" style={{ marginBottom: '24px' }}>
                        {[
                            { f: stackPorFase[0], tools: totalToolsF1 },
                            { f: stackPorFase[1], tools: totalToolsF2 },
                            { f: stackPorFase[2], tools: totalToolsF3 },
                        ].map(({ f, tools }, i) => (
                            <div key={i} className="card card-sm" style={{ borderTop: `3px solid ${f.color}` }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{f.fase}</div>
                                <div style={{ fontSize: '20px', fontWeight: 800, color: f.color, margin: '6px 0' }}>{f.costeRango}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{tools} herramientas · {f.capas.length} capas</div>
                            </div>
                        ))}
                    </div>

                    {/* Detalle por fase y capa */}
                    {stackPorFase.map((fase, fi) => (
                        <div key={fi} style={{ marginBottom: '24px' }}>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: fase.color, marginBottom: '12px', borderLeft: `3px solid ${fase.color}`, paddingLeft: '10px' }}>
                                {fase.fase}
                            </div>
                            {fase.capas.map((capa, ci) => (
                                <div key={ci} className="card" style={{ marginBottom: '12px' }}>
                                    <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>{capa.capa}</div>
                                    <table className="tabla">
                                        <thead>
                                            <tr><th>Herramienta</th><th>Función</th><th>Coste</th><th>Prioridad</th></tr>
                                        </thead>
                                        <tbody>
                                            {capa.tools.map((tool, ti) => {
                                                const prioColor = tool.prioridad === 'CRÍTICA' ? '#ef9a9a' : tool.prioridad === 'Alta' ? 'var(--pistacho)' : '#ffd54f'
                                                const prioBg = tool.prioridad === 'CRÍTICA' ? 'rgba(244,67,54,0.15)' : tool.prioridad === 'Alta' ? 'rgba(147,197,114,0.15)' : 'rgba(255,193,7,0.15)'
                                                return (
                                                    <tr key={ti}>
                                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tool.nombre}</td>
                                                        <td>{tool.funcion}</td>
                                                        <td style={{ color: 'var(--pistacho)', fontWeight: 600 }}>{tool.coste}</td>
                                                        <td><span style={{ background: prioBg, color: prioColor, padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>{tool.prioridad}</span></td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    ))}

                    {/* Diagrama Arquitectura F1 */}
                    <div className="card" style={{ background: 'linear-gradient(145deg, rgba(147, 197, 114, 0.05), rgba(34, 38, 46, 1))' }}>
                        <h3 style={{ marginBottom: '16px' }}>🏗️ Arquitectura Fase 1 (n8n como Hub Central)</h3>
                        <div style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre', overflowX: 'auto' }}>
                            {`┌─────────────────────────────────────────────────┐
│              n8n (Orquestador)                   │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Trigger  │→ │  LLM     │→ │ Action   │       │
│  │ (webhook,│  │ (Claude/ │  │ (CRM,    │       │
│  │  cron,   │  │  Ollama) │  │  email,  │       │
│  │  CRM)    │  │          │  │  Slack)  │       │
│  └──────────┘  └──────────┘  └──────────┘       │
│         ↑                          ↓              │
│    Supabase (RAG: M3 Playbook, ICP, M1-M6)       │
└─────────────────────────────────────────────────┘`}
                        </div>
                        <div style={{ marginTop: '14px', fontSize: '11px', color: 'var(--text-muted)' }}>
                            💡 ¿Por qué n8n y no LangChain/CrewAI en F1? Grenoucerie es un equipo de 2 personas sin developer. n8n permite construir agentes con interfaz visual drag & drop.
                        </div>
                    </div>
                </div>
            )}

            {/* ==== AGENTES ==== */}
            {tab === 'agentes' && (
                <div>
                    <div className="grid-3" style={{ marginBottom: '20px' }}>
                        <div className="card card-sm" style={{ borderTop: '3px solid var(--pistacho)' }}>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--pistacho)' }}>3</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Agentes F1 (Human-in-the-loop)</div>
                        </div>
                        <div className="card card-sm" style={{ borderTop: '3px solid var(--oliva-light)' }}>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--oliva-light)' }}>3</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Agentes F2 (Autonomía progresiva)</div>
                        </div>
                        <div className="card card-sm" style={{ borderTop: '3px solid var(--text-muted)' }}>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-muted)' }}>15</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Sistema completo (visión futura)</div>
                        </div>
                    </div>

                    <div className="grid-3">
                        {agentesPrioritarios.map((ag) => (
                            <div key={ag.id} className="card" style={{ borderLeft: `4px solid ${ag.color}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <div style={{ fontSize: '20px' }}>{ag.emoji}</div>
                                    <span style={{
                                        background: ag.modo === 'Human-in-the-loop' ? 'rgba(147, 197, 114, 0.15)' : 'rgba(186, 184, 108, 0.15)',
                                        color: ag.modo === 'Human-in-the-loop' ? 'var(--pistacho)' : 'var(--oliva-light)',
                                        padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 700
                                    }}>{ag.modo}</span>
                                </div>
                                <h4 style={{ fontSize: '14px', marginBottom: '4px' }}>Agente {ag.id}: {ag.nombre}</h4>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '10px' }}>Fusiona: {ag.fusiona}</div>
                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>{ag.descripcion}</p>

                                <div style={{ padding: '8px', background: 'var(--bg-glass)', borderRadius: '6px', marginBottom: '10px' }}>
                                    <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Stack</div>
                                    <div style={{ fontSize: '11px', color: 'var(--pistacho)', fontWeight: 600 }}>{ag.stack}</div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div style={{ flex: 1, padding: '6px', background: 'rgba(147,197,114,0.05)', borderRadius: '4px' }}>
                                        <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Mínimo</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>{ag.umbralMinimo}</div>
                                    </div>
                                    <div style={{ flex: 1, padding: '6px', background: 'rgba(147,197,114,0.1)', borderRadius: '4px' }}>
                                        <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Óptimo</div>
                                        <div style={{ fontSize: '10px', color: 'var(--pistacho)', fontWeight: 600 }}>{ag.umbralOptimo}</div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '10px', fontSize: '10px', color: 'var(--text-muted)', textAlign: 'right' }}>{ag.fase}</div>
                            </div>
                        ))}
                    </div>

                    {/* Riesgos */}
                    <div style={{ marginTop: '24px' }}>
                        <h3 style={{ marginBottom: '12px' }}>⚠️ Top 3 Riesgos de Implementación</h3>
                        <div className="grid-3">
                            {riesgosStack.map((r, i) => (
                                <div key={i} className="card" style={{ borderTop: '2px solid rgba(244,67,54,0.3)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div style={{ fontWeight: 700, fontSize: '13px' }}>{r.nombre}</div>
                                        <span style={{ fontSize: '10px' }}>{r.probabilidad}</span>
                                    </div>
                                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>{r.descripcion}</p>
                                    <div style={{ padding: '8px', background: 'rgba(147,197,114,0.05)', borderRadius: '6px', fontSize: '11px', color: 'var(--pistacho)', lineHeight: 1.5 }}>
                                        ✅ {r.mitigacion}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ==== ROADMAP ==== */}
            {tab === 'roadmap' && (
                <div>
                    {roadmapAgentes.map((q, qi) => (
                        <div key={qi} style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: q.color }}></div>
                                <div style={{ fontWeight: 700, fontSize: '14px', color: q.color }}>{q.quarter} — "{q.titulo}"</div>
                            </div>
                            <div className="card">
                                <table className="tabla">
                                    <thead>
                                        <tr><th>Hito</th><th>Fecha</th><th>Validación</th></tr>
                                    </thead>
                                    <tbody>
                                        {q.hitos.map((h, hi) => (
                                            <tr key={hi}>
                                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.hito}</td>
                                                <td style={{ color: q.color, fontWeight: 600 }}>{h.fecha}</td>
                                                <td style={{ fontSize: '11px' }}>{h.metrica}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ==== PRESUPUESTO ==== */}
            {tab === 'presupuesto' && (
                <div>
                    <div className="grid-3" style={{ marginBottom: '24px' }}>
                        <div className="card card-sm" style={{ borderTop: '3px solid #ef9a9a' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sistema 15 Agentes (Original)</div>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef9a9a', margin: '6px 0' }}>€50.400/año</div>
                        </div>
                        <div className="card card-sm" style={{ borderTop: '3px solid var(--pistacho)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Stack Optimizado (Propuesta)</div>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--pistacho)', margin: '6px 0' }}>&lt;€3.000/año</div>
                        </div>
                        <div className="card card-sm" style={{ borderTop: '3px solid #4caf50' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ahorro → Reinvertido en Demanda</div>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#4caf50', margin: '6px 0' }}>€47.400</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>→ Ferias, kits muestra, contenido TOFU</div>
                        </div>
                    </div>

                    <div className="card">
                        <table className="tabla">
                            <thead>
                                <tr><th>Concepto</th><th>Plan Original</th><th>Propuesta Lean</th><th>Ahorro</th></tr>
                            </thead>
                            <tbody>
                                {presupuestoComparativo.map((p, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{p.concepto}</td>
                                        <td style={{ color: '#ef9a9a' }}>{p.sistema15}</td>
                                        <td style={{ color: 'var(--pistacho)', fontWeight: 600 }}>{p.propuesta}</td>
                                        <td><span style={{
                                            background: p.ahorro === '=' ? 'rgba(255,255,255,0.05)' : 'rgba(76,175,80,0.15)',
                                            color: p.ahorro === '=' ? 'var(--text-muted)' : '#4caf50',
                                            padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700
                                        }}>{p.ahorro}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="card" style={{ marginTop: '20px', background: 'linear-gradient(145deg, rgba(147,197,114,0.05), rgba(34,38,46,1))' }}>
                        <h3 style={{ marginBottom: '12px' }}>💡 Filosofía del Stack</h3>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: 'var(--pistacho)', marginBottom: '6px' }}>Open Source First</div>
                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>n8n, Metabase, CrewAI, Supabase y LangChain son proyectos de código abierto. Cero vendor lock-in. Si una herramienta muere, se migra sin perder datos.</p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: 'var(--oliva-light)', marginBottom: '6px' }}>IA-First, No Headcount</div>
                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Los €47K ahorrados en software van a generación de demanda real (ferias, kits de muestra, contenido TOFU), no a más licencias. Los agentes IA reemplazan tareas repetitivas sin contratar.</p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: 'var(--salvia)', marginBottom: '6px' }}>Datos Primero, Agentes Después</div>
                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Regla de oro: no desplegar un agente autónomo sobre datos que aún no existen. Fase 1 construye los datos (CRM, web, email). Fase 2 los explota con IA.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
