// Hub de Recetas MOFU enfocado en B2C (Amas de casa y Foodies)
// Componente para visualizar y gestionar las recetas estrella que atraen tráfico SEO

import { useState } from 'react'

export default function HubRecetas() {
    const [recetaActiva, setRecetaActiva] = useState('ajillo')

    // Base de datos local de recetas MOFU
    const recetas = {
        ajillo: {
            id: 'ajillo',
            titulo: 'Ancas de Rana al Ajillo Clásicas',
            dificultad: 'Fácil',
            tiempo: '15 min',
            calorias: '120 kcal',
            target: 'Ama de casa / Tradición',
            descripcion: 'La receta de toda la vida. Perfecta para quienes prueban la rana por primera vez. Un plato rápido, saludable y lleno de sabor.',
            ingredientes: [
                '500g de Ancas de Rana (Descongeladas)',
                '4 dientes de ajo fileteados',
                '1 guindilla seca (opcional)',
                '50ml Aceite de Oliva Virgen Extra (AOVE)',
                'Pimentón dulce al gusto',
                'Perejil fresco picado',
                'Sal y pimienta'
            ],
            pasos: [
                'Secar bien las ancas de rana con papel absorbente. Salpimentar al gusto.',
                'En una sartén amplia, calentar el AOVE y dorar los ajos fileteados junto con la guindilla a fuego medio.',
                'Antes de que el ajo tome demasiado color, incorporar las ancas de rana.',
                'Subir el fuego y saltear durante 3-4 minutos por lado hasta que estén doradas.',
                'Retirar del fuego, espolvorear pimentón y perejil fresco. Servir inmediatamente.'
            ],
            seo: {
                keyword: 'receta ancas de rana al ajillo',
                volumen: 'Alto',
                intencion: 'Informacional'
            }
        },
        tempura: {
            id: 'tempura',
            titulo: 'Piruletas de Rana en Tempura',
            dificultad: 'Media',
            tiempo: '25 min',
            calorias: '180 kcal',
            target: 'Familias / Niños / Foodies',
            descripcion: 'El formato ideal para romper el prejuicio en los más pequeños. Crujiente por fuera, jugoso por dentro.',
            ingredientes: [
                '500g de La Perla (Gemelo de rana limpio)',
                '100g de harina para tempura',
                'Agua muy fría (casi helada)',
                'Aceite de girasol para freír',
                'Salsa agridulce o mayonesa de sriracha para dipear',
                'Palillos de brocheta'
            ],
            pasos: [
                'Insertar cada pieza de La Perla en un palillo a modo de piruleta.',
                'Mezclar la harina de tempura con el agua muy fría hasta obtener una textura de crema ligera. (No batir en exceso).',
                'Calentar abundante aceite a 180ºC.',
                'Sumergir las piruletas en la tempura e introducirlas inmediatamente en el aceite.',
                'Freír 2 minutos hasta que la masa sople. Retirar sobre papel absorbente.'
            ],
            seo: {
                keyword: 'ancas de rana rebozadas para niños',
                volumen: 'Medio',
                intencion: 'Informacional'
            }
        },
        plancha: {
            id: 'plancha',
            titulo: 'Supremas a la Plancha con Limón y Tomillo',
            dificultad: 'Muy Fácil',
            tiempo: '10 min',
            calorias: '85 kcal',
            target: 'Fitness / Salud / Dietas',
            descripcion: 'La proteína animal más magra del mercado. Cero hidratos, grasa mínima y lista en 10 minutos.',
            ingredientes: [
                '400g de Las Supremas (Filetes magros)',
                'Zumo de medio limón',
                'Tomillo fresco',
                'Una gota de AOVE (para la plancha)',
                'Sal en escamas'
            ],
            pasos: [
                'Calentar una plancha o sartén antiadherente a fuego fuerte con una gota de AOVE.',
                'Colocar Las Supremas y sellar 1.5 minutos por cada lado.',
                'En los últimos segundos, rociar con el zumo de limón y esparcir el tomillo picado.',
                'Retirar y finalizar con escamas de sal.'
            ],
            seo: {
                keyword: 'carne saludable baja en grasa a la plancha',
                volumen: 'Alto',
                intencion: 'Informacional / Salud'
            }
        }
    }

    const receta = recetas[recetaActiva]

    return (
        <div>
            <div className="page-header">
                <h2>🍳 Hub de Recetas MOFU</h2>
                <p>Gestor de contenidos gastronómicos B2C. Recetas diseñadas para educar al consumidor, atacar keywords SEO y vencer las barreras de entrada (textura/asco/huesos).</p>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                {Object.keys(recetas).map(key => (
                    <button
                        key={key}
                        onClick={() => setRecetaActiva(key)}
                        style={{
                            flex: 1,
                            padding: '16px',
                            background: recetaActiva === key ? 'rgba(147, 197, 114, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${recetaActiva === key ? 'var(--pistacho)' : 'var(--border)'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s',
                            boxShadow: recetaActiva === key ? '0 4px 12px rgba(147, 197, 114, 0.1)' : 'none'
                        }}
                    >
                        <div style={{ fontSize: '14px', fontWeight: 600, color: recetaActiva === key ? 'var(--pistacho)' : 'var(--text-primary)', marginBottom: '4px' }}>
                            {recetas[key].titulo}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            Target: {recetas[key].target}
                        </div>
                    </button>
                ))}
            </div>

            <div className="card" style={{ borderTop: '3px solid var(--oliva-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                        <h3 style={{ fontSize: '24px', color: 'var(--text-primary)', marginBottom: '8px' }}>{receta.titulo}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, maxWidth: '80%' }}>{receta.descripcion}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '11px', border: '1px solid var(--border)' }}>⏱️ {receta.tiempo}</span>
                        <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '11px', border: '1px solid var(--border)' }}>🔥 {receta.calorias}</span>
                        <span style={{ padding: '4px 10px', background: 'rgba(147, 197, 114, 0.1)', color: 'var(--pistacho)', borderRadius: '12px', fontSize: '11px', border: '1px solid rgba(147, 197, 114, 0.3)' }}>{receta.dificultad}</span>
                    </div>
                </div>

                <div className="grid-3" style={{ marginBottom: '24px' }}>
                    <div style={{ background: 'var(--bg-glass)', padding: '16px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600 }}>SEO & Estrategia</div>
                        <div style={{ fontSize: '12px', marginBottom: '6px' }}><strong style={{ color: 'var(--oliva-light)' }}>Keyword:</strong> "{receta.seo.keyword}"</div>
                        <div style={{ fontSize: '12px', marginBottom: '6px' }}><strong style={{ color: 'var(--oliva-light)' }}>Volumen:</strong> {receta.seo.volumen}</div>
                        <div style={{ fontSize: '12px' }}><strong style={{ color: 'var(--oliva-light)' }}>Intención:</strong> {receta.seo.intencion}</div>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>🛒 Ingredientes</div>
                        <ul style={{ paddingLeft: '20px', margin: 0 }}>
                            {receta.ingredientes.map((ing, idx) => (
                                <li key={idx} style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', lineHeight: 1.4 }}>{ing}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div style={{ padding: '20px', background: 'linear-gradient(145deg, rgba(34, 38, 46, 1), rgba(40, 44, 52, 1))', borderRadius: '8px', borderLeft: '3px solid var(--salvia)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>👨‍🍳 Paso a Paso</div>
                    <ol style={{ paddingLeft: '20px', margin: 0 }}>
                        {receta.pasos.map((paso, idx) => (
                            <li key={idx} style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
                                <span style={{ color: 'var(--text-primary)' }}>{paso}</span>
                            </li>
                        ))}
                    </ol>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button className="btn btn-outline">✏️ Editar Receta</button>
                    <button className="btn btn-primary">📤 Publicar en ancasderana.com (WP)</button>
                </div>
            </div>
        </div>
    )
}
