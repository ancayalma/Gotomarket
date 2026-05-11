// Dashboard CMO — Centro de Mando Marketing & Ventas
// Grenoucerie S.L. — Version 5.0
import { useState, useEffect } from 'react'
import { kpis, empresa, gamas } from '../../data/grenoucerie'
import { useLeads } from '../../hooks/useLeads'

const semaforoColor = {
    verde:   'var(--ok)',
    amarillo:'var(--warn)',
    rojo:    'var(--alert)',
    neutro:  'var(--neutral)',
}

function KpiTile({ label, value, sub, color, pulse }) {
    return (
        <div style={{ padding: '14px 18px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '130px', position: 'relative', overflow: 'hidden' }}>
            {pulse && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: color || 'var(--brand)', opacity: 0.7 }} />}
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: color || 'var(--text-heading)', lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ fontSize: '9.5px', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace' }}>{sub}</div>}
        </div>
    )
}

function AlertaStrip({ leads }) {
    const alertas = [
        { tipo: 'critico', icono: '🔴', texto: 'CRM vacio — 0 leads capturados. Sin pipeline, sin crecimiento.' },
        { tipo: 'alerta',  icono: '🟡', texto: 'LinkedIn inactivo — 0 impresiones/mes. Meta 90d: 10.000.' },
        { tipo: 'ok',      icono: '🟢', texto: 'Revenue 60K/m — run rate 720K. Momentum +87% vs baseline.' },
        { tipo: 'info',    icono: '🔵', texto: 'Francia: 0 distribuidores contactados. Ventana de oportunidad abierta.' },
    ]
    if (leads.total > 0) alertas[0] = { tipo: 'ok', icono: '🟢', texto: `CRM activo — ${leads.total} leads en pipeline.` }

    const [idx, setIdx] = useState(0)
    useEffect(() => {
        const t = setInterval(() => setIdx(i => (i + 1) % alertas.length), 4000)
        return () => clearInterval(t)
    }, [alertas.length])

    const alerta = alertas[idx]
    const border = alerta.tipo === 'critico' ? 'var(--alert)' : alerta.tipo === 'ok' ? 'var(--ok)' : alerta.tipo === 'alerta' ? 'var(--warn)' : '#63b3ed'
    const bg = alerta.tipo === 'critico' ? 'var(--alert-bg)' : alerta.tipo === 'ok' ? 'var(--ok-bg)' : alerta.tipo === 'alerta' ? 'var(--warn-bg)' : 'rgba(99,179,237,0.08)'

    return (
        <div style={{ padding: '8px 16px', background: bg, border: `1px solid ${border}33`, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', transition: 'all 0.4s ease' }}>
            <span style={{ fontSize: '13px' }}>{alerta.icono}</span>
            <span style={{ fontSize: '11.5px', color: 'var(--text-body)', fontFamily: 'DM Mono, monospace', flex: 1 }}>{alerta.texto}</span>
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                {alertas.map((_, i) => (
                    <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: i === idx ? border : 'var(--border-strong)', transition: 'background 0.3s' }} />
                ))}
            </div>
        </div>
    )
}

function MiniEmbudo({ leads, onNavigate }) {
    const stages = [
        { id: 'tofu', label: 'TOFU', sub: 'Awareness', kpi: 'IG 1K', color: '#6b8a5e', w: 100 },
        { id: 'mofu', label: 'MOFU', sub: 'Educacion', kpi: 'Web 500/m', color: '#93C572', w: 75 },
        { id: 'bofu', label: 'BOFU', sub: 'Conversion', kpi: `${leads.total} leads`, color: '#BAB86C', w: 50 },
        { id: 'pipeline', label: 'PIPELINE', sub: '6 fases B2B', kpi: `${leads.byStage.activo} activos`, color: '#4caf50', w: 30 },
    ]
    return (
        <div className="card" style={{ padding: '16px', cursor: 'pointer' }} onClick={onNavigate}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Embudo de Mercado</span>
                <span style={{ color: 'var(--brand)', fontSize: '9px' }}>ver funnel</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                {stages.map(s => (
                    <div key={s.id} style={{ width: `${s.w}%`, minWidth: '120px', background: `${s.color}15`, border: `1px solid ${s.color}33`, borderRadius: '3px', padding: '5px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontSize: '9px', fontWeight: 700, color: s.color, fontFamily: 'DM Mono, monospace' }}>{s.label}</span>
                            <span style={{ fontSize: '8px', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace', marginLeft: '4px' }}>{s.sub}</span>
                        </div>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{s.kpi}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function PipelineMini({ leads, onNavigate }) {
    const fases = [
        { id: 'prospeccion', label: 'Prospeccion', emoji: '🔍' },
        { id: 'contacto',    label: 'Contacto',    emoji: '📞' },
        { id: 'muestra',     label: 'Muestra',     emoji: '📦' },
        { id: 'negociacion', label: 'Negociacion', emoji: '🤝' },
        { id: 'activo',      label: 'Activo',      emoji: '✅' },
        { id: 'embajador',   label: 'Embajador',   emoji: '⭐' },
    ]
    const total = Object.values(leads.byStage).reduce((a, b) => a + b, 0)
    return (
        <div className="card" style={{ padding: '16px', cursor: 'pointer' }} onClick={onNavigate}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Pipeline B2B</span>
                <span style={{ color: 'var(--brand)', fontSize: '9px' }}>ver kanban</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                {fases.map(f => {
                    const count = leads.byStage[f.id] || 0
                    return (
                        <div key={f.id} style={{ textAlign: 'center', padding: '8px 4px', background: count > 0 ? 'var(--ok-bg)' : 'var(--bg-elevated)', border: `1px solid ${count > 0 ? 'var(--ok)33' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontSize: '14px' }}>{f.emoji}</div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: count > 0 ? 'var(--ok)' : 'var(--text-faint)', fontFamily: 'Space Grotesk, sans-serif' }}>{count}</div>
                            <div style={{ fontSize: '7.5px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', lineHeight: 1.2, marginTop: '2px' }}>{f.label}</div>
                        </div>
                    )
                })}
            </div>
            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'DM Mono, monospace', color: 'var(--text-faint)' }}>
                <span>Total leads: <span style={{ color: total > 0 ? 'var(--ok)' : 'var(--alert)', fontWeight: 700 }}>{total}</span></span>
                <span>Meta 90d: <span style={{ color: 'var(--warn)' }}>50+</span></span>
            </div>
        </div>
    )
}

function CanalChip({ canal, estado, posts, meta }) {
    const estadoColor = estado === 'activo' ? 'var(--ok)' : estado === 'pendiente' ? 'var(--warn)' : 'var(--alert)'
    return (
        <div style={{ padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-body)' }}>{canal}</span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: estadoColor, display: 'block' }} />
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{posts}</div>
            <div style={{ fontSize: '9px', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace' }}>{meta}</div>
        </div>
    )
}

function MercadoCard({ mercado, onNavegar }) {
    return (
        <div style={{ background: `linear-gradient(135deg, ${mercado.colorGlow} 0%, var(--bg-card) 60%)`, border: `1px solid ${mercado.colorBorder}`, borderRadius: 'var(--radius-md)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: mercado.color, borderRadius: '3px 0 0 3px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>{mercado.bandera}</span>
                    <div>
                        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)' }}>{mercado.nombre}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{mercado.subtitulo}</div>
                    </div>
                </div>
                <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '8.5px', fontFamily: 'DM Mono, monospace', fontWeight: 600, background: `${mercado.etiquetaColor}18`, color: mercado.etiquetaColor, border: `1px solid ${mercado.etiquetaColor}33` }}>{mercado.etiqueta}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {mercado.kpis.map((kpi, i) => (
                    <div key={i} style={{ padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{kpi.label}</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: semaforoColor[kpi.semaforo] || 'var(--text-heading)', fontFamily: 'Space Grotesk, sans-serif', marginTop: '2px' }}>{kpi.valor}</div>
                        <div style={{ fontSize: '8.5px', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace' }}>{kpi.meta}</div>
                    </div>
                ))}
            </div>
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '8.5px', fontFamily: 'DM Mono, monospace', color: 'var(--text-faint)' }}>
                    <span>Progreso</span>
                    <span style={{ color: mercado.color }}>{mercado.objetivo} · {mercado.periodo}</span>
                </div>
                <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${mercado.progreso}%`, background: `linear-gradient(90deg, ${mercado.color}88, ${mercado.color})`, borderRadius: '2px' }} />
                </div>
            </div>
            <div style={{ padding: '8px 10px', background: `${mercado.color}0f`, border: `1px solid ${mercado.color}22`, borderRadius: 'var(--radius-sm)', fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                <span style={{ color: mercado.etiquetaColor, fontWeight: 600, fontFamily: 'DM Mono, monospace', fontSize: '9px' }}>Accion: </span>
                {mercado.acciones[0].texto}
            </div>
            {onNavegar && (
                <button onClick={onNavegar} style={{ width: '100%', padding: '7px', background: `${mercado.color}12`, border: `1px solid ${mercado.color}30`, borderRadius: 'var(--radius-sm)', color: mercado.color, fontSize: '10px', fontFamily: 'DM Mono, monospace', cursor: 'pointer', transition: 'all 0.2s' }}>
                    Abrir modulo {mercado.nombre}
                </button>
            )}
        </div>
    )
}

function AccionesSemanales() {
    const acciones = [
        { color: 'var(--alert)', icono: '🔴', accion: 'Activar HubSpot CRM con pipeline multi-gama', deadline: 'HOY' },
        { color: 'var(--alert)', icono: '🔴', accion: 'Publicar primer post TOFU en Instagram + LinkedIn', deadline: 'Esta semana' },
        { color: 'var(--warn)',  icono: '🟡', accion: 'Construir lista 50 targets: 20 Vietnam + 20 Premium + 10 rest.', deadline: 'Semana 2' },
        { color: 'var(--warn)',  icono: '🟡', accion: 'LinkedIn FR: Investigar Top 50 distribuidores', deadline: 'Semana 2' },
        { color: 'var(--ok)',    icono: '🟢', accion: 'Publicar tabla nutricional rana vs carnes en web', deadline: 'Semana 3' },
    ]
    return (
        <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                Prioridades esta semana
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {acciones.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 10px', background: i < 2 ? 'var(--alert-bg)' : i < 4 ? 'var(--warn-bg)' : 'var(--ok-bg)', borderRadius: 'var(--radius-sm)', border: `1px solid ${i < 2 ? 'var(--alert)' : i < 4 ? 'var(--warn)' : 'var(--ok)'}22` }}>
                        <span style={{ fontSize: '11px', flexShrink: 0, marginTop: '1px' }}>{a.icono}</span>
                        <div style={{ flex: 1, fontSize: '11px', color: 'var(--text-body)', lineHeight: 1.4 }}>{a.accion}</div>
                        <span style={{ fontSize: '8px', color: a.color, fontFamily: 'DM Mono, monospace', padding: '2px 6px', borderRadius: '10px', background: `${a.color}15`, border: `1px solid ${a.color}33`, flexShrink: 0, whiteSpace: 'nowrap' }}>{a.deadline}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

const MERCADOS_DATA = [
    {
        id: 'espana', bandera: '\u{1F1EA}\u{1F1F8}', nombre: 'España',
        subtitulo: 'Mercado domestico — Creacion de categoria',
        color: '#c0392b', colorGlow: 'rgba(192,57,43,0.08)', colorBorder: 'rgba(192,57,43,0.25)',
        etiqueta: 'Activo', etiquetaColor: '#4ade80',
        kpis: [
            { label: 'Facturacion/mes', valor: '€60K', meta: '→65K', semaforo: 'verde' },
            { label: 'Clientes B2B', valor: '~15', meta: '→30+', semaforo: 'amarillo' },
            { label: 'Leads CRM', valor: '0', meta: '→50+', semaforo: 'rojo' },
            { label: 'Trafico web', valor: '~500/m', meta: '→1.500', semaforo: 'amarillo' },
        ],
        acciones: [{ texto: 'Activar HubSpot CRM — pipeline 0 leads sin trastienda' }],
        progreso: 35, objetivo: '€720K', periodo: '2026',
    },
    {
        id: 'francia', bandera: '\u{1F1EB}\u{1F1F7}', nombre: 'Francia',
        subtitulo: 'Penetracion — mercado x20 existente',
        color: '#2563eb', colorGlow: 'rgba(37,99,235,0.08)', colorBorder: 'rgba(37,99,235,0.25)',
        etiqueta: 'Expansion', etiquetaColor: 'var(--brand)',
        kpis: [
            { label: 'Distribuidores FR', valor: '0', meta: '→2-3', semaforo: 'neutro' },
            { label: 'Potencial vs ES', valor: 'x20', meta: 'Mercado', semaforo: 'verde' },
            { label: 'Presupuesto 90d', valor: '€3-5K', meta: 'Aprobado', semaforo: 'amarillo' },
            { label: 'Leads FR', valor: '0', meta: '→10+', semaforo: 'neutro' },
        ],
        acciones: [{ texto: 'Investigar Top 50 distribuidores FR + 30 restaurantes grenouille' }],
        progreso: 8, objetivo: '€50K', periodo: 'Q4 2026',
    },
    {
        id: 'petfood', bandera: '\u{1F43E}', nombre: 'Petfood',
        subtitulo: 'Nuevo mercado — innovacion pura',
        color: '#7c3aed', colorGlow: 'rgba(124,58,237,0.08)', colorBorder: 'rgba(124,58,237,0.25)',
        etiqueta: 'Exploracion', etiquetaColor: 'var(--accent)',
        kpis: [
            { label: 'Estado', valor: 'Pre-seed', meta: 'Piloto', semaforo: 'neutro' },
            { label: 'Mercado EU', valor: '€18B', meta: 'Potencial', semaforo: 'verde' },
            { label: 'Competidores', valor: '0', meta: 'Sin rival', semaforo: 'verde' },
            { label: 'Clientes beta', valor: '0', meta: '3 marcas', semaforo: 'neutro' },
        ],
        acciones: [{ texto: 'Investigar requisitos proteina animal alternativa para petfood EU' }],
        progreso: 5, objetivo: 'Piloto', periodo: '2027',
    },
]

const CANALES_DATA = [
    { canal: 'LinkedIn CEO',   estado: 'pendiente', posts: '0 posts/mes',       meta: '10K impres.' },
    { canal: 'Instagram',      estado: 'pendiente', posts: '1.043 seguidores',   meta: '2K en 90d' },
    { canal: 'TikTok',         estado: 'pendiente', posts: 'Sin publicar',       meta: '6 videos/m' },
    { canal: 'Blog SEO',       estado: 'pendiente', posts: '~500 visitas/m',     meta: '1.500/m' },
    { canal: 'Email B2B',      estado: 'pendiente', posts: 'Sin lista',          meta: '500 contactos' },
    { canal: 'YouTube',        estado: 'pendiente', posts: '0 videos recetas',   meta: '6 en 90d' },
]

export default function Dashboard({ cambiarVista }) {
    const leads = useLeads()
    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const navegarMercado = {
        espana:  () => cambiarVista('espana'),
        francia: () => cambiarVista('francia'),
        petfood: () => cambiarVista('petfood'),
    }

    return (
        <div className="fade-in">

            <div className="page-header" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                        <h1 className="page-title" style={{ marginBottom: '4px' }}>Centro de Mando CMO</h1>
                        <div className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>Grenoucerie S.L.</span>
                            <span style={{ color: 'var(--text-faint)' }}>·</span>
                            <span style={{ textTransform: 'capitalize' }}>{today}</span>
                            {leads.connected && <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '10px', background: 'var(--ok-bg)', color: 'var(--ok)', border: '1px solid var(--ok)33', fontFamily: 'DM Mono, monospace' }}>● live</span>}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', padding: '5px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontFamily: 'DM Mono, monospace', alignItems: 'center' }}>
                        <span style={{ color: 'var(--ok)' }}>● {kpis.filter(k => k.semaforo === 'verde').length} ok</span>
                        <span style={{ color: 'var(--text-faint)' }}>·</span>
                        <span style={{ color: 'var(--warn)' }}>● {kpis.filter(k => k.semaforo === 'amarillo').length} alerta</span>
                        <span style={{ color: 'var(--text-faint)' }}>·</span>
                        <span style={{ color: 'var(--alert)' }}>● {kpis.filter(k => k.semaforo === 'rojo').length} critico</span>
                    </div>
                </div>
            </div>

            <AlertaStrip leads={leads} />

            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '2px' }}>
                <KpiTile label="Facturacion mensual" value="€60K"  sub="meta €65K 90d"      color="var(--ok)"     pulse />
                <KpiTile label="Facturacion 2025"    value="€379K" sub="+87% vs baseline"   color="var(--brand)"  pulse />
                <KpiTile label="Run rate 2026"       value="€720K" sub="mercado domestico"  color="var(--ok)"     pulse />
                <KpiTile label="Leads CRM"           value={String(leads.total)} sub="meta 90d: 50+" color={leads.total > 0 ? 'var(--ok)' : 'var(--alert)'} pulse />
                <KpiTile label="Pipeline activo"     value={String(leads.byStage.activo || 2)} sub="clientes con pedidos" color="var(--brand)" pulse />
                <KpiTile label="Instagram"           value="1.043" sub="2.000 en 90d"       color="var(--warn)"  pulse />
                <KpiTile label="LinkedIn"            value="216"   sub="10K impres./mes"    color="var(--warn)"  pulse />
                <KpiTile label="Francia"             value="x20"   sub="potencial vs ES"    color="var(--accent)" pulse />
            </div>

            <div style={{ padding: '14px 20px', marginBottom: '20px', background: 'var(--brand-glow)', border: '1px solid var(--border-brand)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '15px', fontWeight: 700, color: 'var(--brand)' }}>
                        🐸 "{empresa.mensajeCentral}"
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'DM Mono, monospace' }}>
                        3 mercados · monoproducto 4 gamas · CEO + IA · Zamora - Europa
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {[
                        { l: 'EBITDA', v: '-€54K', c: 'var(--alert)' },
                        { l: 'Vietnam', v: '99%', c: 'var(--text-muted)' },
                        { l: 'Clientes B2B', v: '~15', c: 'var(--warn)' },
                        { l: 'Gamas', v: '4', c: 'var(--brand)' },
                    ].map(m => (
                        <div key={m.l} style={{ textAlign: 'center', padding: '5px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: m.c, fontFamily: 'Space Grotesk, sans-serif' }}>{m.v}</div>
                            <div style={{ fontSize: '8px', color: 'var(--text-faint)', fontFamily: 'DM Mono, monospace' }}>{m.l}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '20px' }}>
                <MiniEmbudo leads={leads} onNavigate={() => cambiarVista('funnel')} />
                <PipelineMini leads={leads} onNavigate={() => cambiarVista('pipeline')} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div className="section-label" style={{ margin: 0 }}>Mercados activos</div>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <div style={{ fontSize: '9px', fontFamily: 'DM Mono, monospace', color: 'var(--text-faint)' }}>3 territorios</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {MERCADOS_DATA.map(m => <MercadoCard key={m.id} mercado={m} onNavegar={navegarMercado[m.id]} />)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div className="card" style={{ padding: '16px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Canales de Marketing</span>
                        <button onClick={() => cambiarVista('contenidos')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: '9px', cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}>gestionar</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        {CANALES_DATA.map((c, i) => <CanalChip key={i} {...c} />)}
                    </div>
                </div>
                <AccionesSemanales />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div className="section-label" style={{ margin: 0 }}>Portafolio de Producto</div>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
                {gamas.map(g => (
                    <div key={g.id} style={{ padding: '14px', background: 'var(--bg-elevated)', border: `1px solid ${g.color}33`, borderRadius: 'var(--radius-md)', borderTop: `3px solid ${g.color}` }}>
                        <div style={{ fontSize: '18px', marginBottom: '6px' }}>{g.emoji}</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: g.color, fontFamily: 'Space Grotesk, sans-serif' }}>{g.nombre}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', marginTop: '2px' }}>{g.tipo}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-faint)', marginTop: '6px', lineHeight: 1.4 }}>{g.cliente.split(' + ')[0]}</div>
                        {g.id === 'despieces' && (
                            <div style={{ marginTop: '6px', fontSize: '8.5px', padding: '3px 6px', background: 'var(--accent-dim)', color: 'var(--accent)', borderRadius: '3px', fontFamily: 'DM Mono, monospace' }}>SIN COMPETENCIA</div>
                        )}
                    </div>
                ))}
            </div>

            <div className="card card-warn" style={{ borderLeft: '4px solid var(--alert)' }}>
                <div className="section-label" style={{ color: 'var(--alert)' }}>Bloqueo Critico — Accion Inmediata</div>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '18px' }}>🔴</div>
                    <div>
                        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '13px', color: 'var(--text-heading)', marginBottom: '4px' }}>
                            Sin CRM operativo = sin pipeline = sin crecimiento digital
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            €720K run rate con 0 leads en CRM. Los ~15 clientes actuales no existen digitalmente.
                            Los agentes IA no tienen input. Francia espera distribuidor.
                            Primera accion: activar HubSpot CRM + primer post TOFU esta semana.
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}
