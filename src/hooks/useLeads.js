// Hook para obtener datos reales de leads desde Supabase
import { useState, useEffect } from 'react'
import { supabase, isConnected } from '../lib/supabase'

// Datos fallback si Supabase no está configurado
const FALLBACK = {
    total: 0,
    hot: 0,
    warm: 0,
    cold: 0,
    byStage: { prospeccion: 0, contacto: 0, muestra: 0, negociacion: 0, activo: 2, embajador: 0 },
    conversations: 0,
    loading: false,
    error: null,
    connected: false,
}

export function useLeads() {
    const [data, setData] = useState({ ...FALLBACK, loading: isConnected })

    useEffect(() => {
        if (!isConnected || !supabase) {
            setData({ ...FALLBACK })
            return
        }

        async function fetchLeads() {
            try {
                // Fetch lead counts
                const { data: leads, error } = await supabase
                    .from('wa_leads')
                    .select('score, stage')

                if (error) throw error

                // Fetch conversation count
                const { count: convCount } = await supabase
                    .from('contacts')
                    .select('*', { count: 'exact', head: true })

                const hot  = leads?.filter(l => l.score === 'hot').length  || 0
                const warm = leads?.filter(l => l.score === 'warm').length || 0
                const cold = leads?.filter(l => l.score === 'cold').length || 0

                const byStage = {
                    prospeccion: 0, contacto: 0, muestra: 0,
                    negociacion: 0, activo: 0, embajador: 0,
                }
                leads?.forEach(l => {
                    const stage = l.stage?.toLowerCase()
                    if (byStage[stage] !== undefined) byStage[stage]++
                })

                setData({
                    total: leads?.length || 0,
                    hot, warm, cold,
                    byStage,
                    conversations: convCount || 0,
                    loading: false,
                    error: null,
                    connected: true,
                })
            } catch (err) {
                setData({ ...FALLBACK, error: err.message, connected: false })
            }
        }

        fetchLeads()

        // Refresh every 2 minutes
        const interval = setInterval(fetchLeads, 120_000)
        return () => clearInterval(interval)
    }, [])

    return data
}
