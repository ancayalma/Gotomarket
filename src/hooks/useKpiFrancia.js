// Hook KPI Francia €500K — datos en tiempo real desde Supabase
import { useState, useEffect } from 'react'
import { supabase, isConnected } from '../lib/supabase'

const FALLBACK = {
    pipeline_eur:   0,
    leads_activos:  0,
    deals_activos:  0,
    objetivo_eur:   500000,
    dias_restantes: Math.ceil((new Date('2026-12-31') - new Date()) / 86400000),
    pct_objetivo:   0,
    loading:        false,
    connected:      false,
}

export function useKpiFrancia() {
    const [data, setData] = useState({ ...FALLBACK, loading: isConnected })

    useEffect(() => {
        if (!isConnected || !supabase) {
            setData({ ...FALLBACK })
            return
        }

        async function fetchKpi() {
            try {
                const { data: kpi, error } = await supabase.rpc('get_kpi_fr')
                if (error) throw error
                setData({
                    pipeline_eur:   kpi?.pipeline_eur   ?? 0,
                    leads_activos:  kpi?.leads_activos  ?? 0,
                    deals_activos:  kpi?.deals_activos  ?? 0,
                    objetivo_eur:   kpi?.objetivo_eur   ?? 500000,
                    dias_restantes: kpi?.dias_restantes ?? FALLBACK.dias_restantes,
                    pct_objetivo:   kpi?.pct_objetivo   ?? 0,
                    loading:        false,
                    connected:      true,
                })
            } catch (err) {
                console.warn('[useKpiFrancia] Error:', err.message)
                setData({ ...FALLBACK, connected: false })
            }
        }

        fetchKpi()

        // Suscripción Realtime — actualiza al instante cuando Hermes escribe
        const channel = supabase
            .channel('kpi_snapshot_fr')
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'kpi_snapshot' },
                () => fetchKpi()
            )
            .subscribe()

        // Safety net: refresco cada 60s
        const interval = setInterval(fetchKpi, 60_000)

        return () => {
            supabase.removeChannel(channel)
            clearInterval(interval)
        }
    }, [])

    return data
}
