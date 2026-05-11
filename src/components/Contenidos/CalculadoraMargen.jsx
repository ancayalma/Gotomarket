// Calculadora de Margen interactiva para hosteleros B2B
// Herramienta MOFU que demuestra la rentabilidad de las ancas de rana
import { useState } from 'react'

export default function CalculadoraMargen() {
    // Estado de los inputs del usuario
    const [racionesSemana, setRacionesSemana] = useState(20)
    const [precioVenta, setPrecioVenta] = useState(14)
    const [costoProducto, setCostoProducto] = useState(4.5)

    // Cálculos automáticos
    const margenPorRacion = precioVenta - costoProducto
    const porcentajeMargen = ((margenPorRacion / precioVenta) * 100).toFixed(1)
    const beneficioSemanal = margenPorRacion * racionesSemana
    const beneficioMensual = beneficioSemanal * 4.3
    const beneficioAnual = beneficioMensual * 12

    // Comparación con solomillo (referencia hostelero)
    const costoSolomillo = 12
    const precioVentaSolomillo = 22
    const margenSolomillo = ((precioVentaSolomillo - costoSolomillo) / precioVentaSolomillo * 100).toFixed(1)

    return (
        <div>
            <div className="page-header">
                <h2>📊 Calculadora de Margen — Ancas de Rana en tu Carta</h2>
                <p>Descubre cuánto puedes ganar añadiendo ancas de rana a tu menú. Ajusta los valores con los controles.</p>
            </div>

            {/* Inputs interactivos */}
            <div className="grid-3" style={{ marginBottom: '24px' }}>
                {/* Raciones por semana */}
                <div className="card" style={{ borderTop: '3px solid var(--pistacho)' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '1px' }}>
                        🍽️ Raciones por semana
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--pistacho)', marginBottom: '12px' }}>
                        {racionesSemana}
                    </div>
                    <input
                        type="range"
                        min="5"
                        max="100"
                        value={racionesSemana}
                        onChange={(e) => setRacionesSemana(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--pistacho)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <span>5 raciones</span>
                        <span>100 raciones</span>
                    </div>
                </div>

                {/* Precio de venta en carta */}
                <div className="card" style={{ borderTop: '3px solid var(--oliva-light)' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '1px' }}>
                        💰 Precio en carta (PVP)
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--oliva-light)', marginBottom: '12px' }}>
                        {precioVenta}€
                    </div>
                    <input
                        type="range"
                        min="8"
                        max="35"
                        step="0.5"
                        value={precioVenta}
                        onChange={(e) => setPrecioVenta(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--oliva-light)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <span>8€</span>
                        <span>35€</span>
                    </div>
                </div>

                {/* Costo del producto */}
                <div className="card" style={{ borderTop: '3px solid var(--salvia)' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '1px' }}>
                        📦 Coste por ración (producto)
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--salvia)', marginBottom: '12px' }}>
                        {costoProducto}€
                    </div>
                    <input
                        type="range"
                        min="2"
                        max="10"
                        step="0.5"
                        value={costoProducto}
                        onChange={(e) => setCostoProducto(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--salvia)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <span>2€</span>
                        <span>10€</span>
                    </div>
                </div>
            </div>

            {/* Resultados principales */}
            <div className="card" style={{
                marginBottom: '24px',
                background: 'linear-gradient(145deg, rgba(147, 197, 114, 0.08), rgba(34, 38, 46, 1))',
                borderColor: 'rgba(147, 197, 114, 0.3)',
            }}>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
                    📈 Tu beneficio con ancas de rana
                </div>
                <div className="grid-4">
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Margen por ración</div>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--pistacho)' }}>{margenPorRacion.toFixed(1)}€</div>
                        <div style={{
                            fontSize: '13px', fontWeight: 700, marginTop: '4px',
                            color: Number(porcentajeMargen) >= 60 ? 'var(--verde)' : Number(porcentajeMargen) >= 40 ? 'var(--amarillo)' : '#e57373',
                        }}>
                            {porcentajeMargen}% margen
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Beneficio semanal</div>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--oliva-light)' }}>{beneficioSemanal.toFixed(0)}€</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Beneficio mensual</div>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--salvia)' }}>{beneficioMensual.toFixed(0)}€</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Beneficio anual</div>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: '#4caf50' }}>{beneficioAnual.toFixed(0)}€</div>
                    </div>
                </div>
            </div>

            {/* Comparativa con solomillo */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '16px' }}>
                    ⚔️ Comparativa: Ancas de Rana vs Solomillo de Ternera
                </div>
                <div className="grid-3">
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>CONCEPTO</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 2 }}>
                            Coste materia prima<br />
                            PVP en carta sugerido<br />
                            Margen bruto<br />
                            Competencia en zona
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(147, 197, 114, 0.06)', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--pistacho)', marginBottom: '6px', fontWeight: 700 }}>🐸 ANCAS DE RANA</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 2, fontWeight: 600 }}>
                            {costoProducto.toFixed(1)}€<br />
                            {precioVenta}€<br />
                            <span style={{ color: 'var(--verde)' }}>{porcentajeMargen}%</span><br />
                            <span style={{ color: 'var(--verde)' }}>Casi nula</span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 700 }}>🥩 SOLOMILLO</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 2 }}>
                            12€<br />
                            22€<br />
                            <span style={{ color: 'var(--amarillo)' }}>{margenSolomillo}%</span><br />
                            <span style={{ color: '#e57373' }}>Todos lo tienen</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Argumento final + CTA */}
            <div className="card" style={{
                borderColor: 'rgba(147, 197, 114, 0.4)',
                background: 'rgba(147, 197, 114, 0.04)',
                textAlign: 'center',
                padding: '24px',
            }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--pistacho)', marginBottom: '8px' }}>
                    {Number(porcentajeMargen) >= 60
                        ? `🎯 Con ${porcentajeMargen}% de margen, la rana es uno de los platos más rentables de tu carta`
                        : `💡 Ajusta el precio en carta para alcanzar el 60% de margen que logran otros chefs`
                    }
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
                    Sin competencia en tu código postal. Trazabilidad de estanque a plato.
                    <br />Producto diferenciador que genera conversación con tus comensales.
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    * Los cálculos son orientativos. El coste incluye producto; no incluye preparación, servicio ni fijos.
                </div>
            </div>
        </div>
    )
}
