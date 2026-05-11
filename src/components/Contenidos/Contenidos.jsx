import { pilaresContenido, canalesDistribucion, hacksCopywriting } from '../../data/estrategia_contenidos'
import { embudo } from '../../data/grenoucerie'
import { useState } from 'react'
import GenerarPost from './GenerarPost'
import CalculadoraMargen from './CalculadoraMargen'
import HubRecetas from './HubRecetas'

export default function Contenidos() {
    const [tab, setTab] = useState('canales')

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2>📱 Canales, Contenido & Campañas</h2>
                    <p>Motor de Generación de Demanda: B2C educa y crea el mercado; B2B captura la demanda y factura.</p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button className={tab === 'canales' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTab('canales')}>📡 Canales</button>
                    <button className={tab === 'pilares' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTab('pilares')}>🏛️ Pilares</button>
                    <button className={tab === 'recetas' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTab('recetas')}>🍳 Recetas B2C</button>
                    <button className={tab === 'copy' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTab('copy')}>✍️ Copywriting</button>
                    <button className={tab === 'generador' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTab('generador')}>✨ IA Posts</button>
                    <button className={tab === 'calculadora' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTab('calculadora')}>📊 Margen B2B</button>
                </div>
            </div>

            {/* TAB: CANALES */}
            {tab === 'canales' && (
                <div className="grid-3">
                    <div className="card" style={{ borderTop: '3px solid var(--oliva)' }}>
                        <h3 style={{ color: 'var(--oliva-light)', marginBottom: '16px' }}>🏢 B2B (Hostelería & Distribución)</h3>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            FOCO: Retorno de Inversión (60-70% margen), Exclusividad y Suministro Seguro.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {canalesDistribucion.b2b.map((item, i) => (
                                <div key={i} style={{ padding: '10px', background: 'rgba(128, 128, 0, 0.05)', borderRadius: '8px', border: '1px solid rgba(128,128,0,0.1)' }}>
                                    <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>{item.nombre}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{item.formato}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--oliva-light)', marginTop: '6px', fontWeight: 600 }}>⏱️ {item.frecuencia}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ borderTop: '3px solid var(--pistacho)' }}>
                        <h3 style={{ color: 'var(--pistacho)', marginBottom: '16px' }}>👥 B2C (Consumidor & Foodie)</h3>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            FOCO: Salud (0.3g grasa), Educar al paladar, Romper prejuicios visualmente.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {canalesDistribucion.b2c.map((item, i) => (
                                <div key={i} style={{ padding: '10px', background: 'rgba(147, 197, 114, 0.05)', borderRadius: '8px', border: '1px solid rgba(147,197,114,0.1)' }}>
                                    <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>{item.nombre}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{item.formato}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--pistacho)', marginTop: '6px', fontWeight: 600 }}>⏱️ {item.frecuencia}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ borderTop: '3px solid #4d9de0' }}>
                        <h3 style={{ color: '#4d9de0', marginBottom: '16px' }}>🇫🇷 Francia B2B (Penetración)</h3>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            FOCO: Caballo de Troya (AquaPremium) + Cortes Innovadores (Despieces).
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {canalesDistribucion.b2b_fr.map((item, i) => (
                                <div key={i} style={{ padding: '10px', background: 'rgba(77, 157, 224, 0.05)', borderRadius: '8px', border: '1px solid rgba(77,157,224,0.1)' }}>
                                    <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>{item.nombre}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{item.formato}</div>
                                    <div style={{ fontSize: '10px', color: '#4d9de0', marginTop: '6px', fontWeight: 600 }}>⏱️ {item.frecuencia}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: PILARES */}
            {tab === 'pilares' && (
                <div className="grid-4">
                    {pilaresContenido.map((pilar, i) => (
                        <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: '24px', marginBottom: '10px' }}>{pilar.nombre.split(' ')[0]}</div>
                            <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>{pilar.nombre.split(' ').slice(1).join(' ')}</h3>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px', flex: 1 }}>
                                {pilar.foco}
                            </div>
                            <div style={{ padding: '10px', background: 'var(--bg-glass)', borderRadius: '6px', marginBottom: '12px' }}>
                                <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>🎯 Targets</div>
                                <div style={{ fontSize: '11px', color: 'var(--pistacho)', fontWeight: 600 }}>{pilar.targets.join(', ')}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>📝 FormatOS</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {pilar.formatos.map((f, j) => (
                                        <span key={j} style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', border: '1px solid var(--border)' }}>{f}</span>
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                                "{pilar.ejemplo}"
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB: COPYWRITING */}
            {tab === 'copy' && (
                <div>
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <h3 style={{ marginBottom: '12px', color: 'var(--pistacho)' }}>🧠 Hacks Psicológicos (Basado en Maïder Tomasena)</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                            Cómo romper la barrera del escepticismo ante un producto desconocido o con prejuicios usando el lenguaje H2H (Human to Human).
                        </p>
                        <div className="grid-4">
                            {hacksCopywriting.map((hack, i) => (
                                <div key={i} style={{ padding: '16px', background: 'var(--bg-glass)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '8px' }}>{hack.tecnica}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{hack.aplicacion}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: GENERADOR DE POSTS */}
            {tab === 'generador' && (
                <div style={{ marginBottom: '20px' }}>
                    <GenerarPost />
                </div>
            )}

            {/* TAB: CALCULADORA DE MARGEN B2B */}
            {tab === 'calculadora' && (
                <div style={{ marginBottom: '20px' }}>
                    <CalculadoraMargen />
                </div>
            )}

            {/* TAB: HUB RECETAS B2C */}
            {tab === 'recetas' && (
                <div style={{ marginBottom: '20px' }}>
                    <HubRecetas />
                </div>
            )}

            {/* Integración con Funnel TOFU/MOFU */}
            <div className="card" style={{ marginTop: '24px', background: 'linear-gradient(145deg, rgba(147, 197, 114, 0.05), rgba(34, 38, 46, 1))' }}>
                <h3 style={{ marginBottom: '16px' }}>🔄 El Motor de Demanda en Acción</h3>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ flex: 1, padding: '16px', borderRight: '1px dashed var(--border)' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Paso 1: Romper el Patrón</div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--pistacho)', marginBottom: '4px' }}>TOFU B2C (Instagram/TikTok)</div>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Usamos el pilar de <strong>Salud</strong> y el hack de <strong>Contraste Inesperado</strong> para generar miles de impresiones baratas sobre "la rana como proteína fitness". Empezamos a ranquear en Google (SEO).</p>
                    </div>
                    <div style={{ flex: 1, padding: '16px', borderRight: '1px dashed var(--border)' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Paso 2: Generar Autoridad</div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--oliva-light)', marginBottom: '4px' }}>MOFU B2B (LinkedIn CEO)</div>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Fabián publica insights sobre <strong>Rentabilidad</strong> e <strong>Innovación</strong>. Los chefs empiezan a ver la rana no como un bicho raro, sino como una bestia de hacer margen (+60%).</p>
                    </div>
                    <div style={{ flex: 1, padding: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Paso 3: Captura de Demanda</div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--salvia)', marginBottom: '4px' }}>Pipeline B2B Activo</div>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>El Outreach B2B usa la <strong>Fórmula FAB</strong>. Como ya hay ruido en el mercado (Paso 1 y 2), la tasa de apertura de emails sube y el CRM (Kanban) se llena de leads.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
