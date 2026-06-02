import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard/Dashboard'
import Pipeline from './components/Pipeline/Pipeline'
import Funnel from './components/Funnel/Funnel'
import Contenidos from './components/Contenidos/Contenidos'
import Francia from './components/Francia/Francia'
import FranciaPanel from './components/FranciaPanel/FranciaPanel'
import Espana from './components/Espana/Espana'
import Petfood from './components/Petfood/Petfood'
import Stack from './components/Stack/Stack'
import Prompt from './components/Prompt/Prompt'
import Roadmap from './components/Roadmap/Roadmap'
import Conexiones from './components/Conexiones/Conexiones'
import BrightBean from './components/BrightBean/BrightBean'
import Chatwoot from './components/Chatwoot/Chatwoot'
import Factusol from './components/Factusol/Factusol'
import Pizarra from './components/Pizarra/Pizarra'
import './index.css'

const VISTAS = {
    dashboard:  Dashboard,
    funnel:     Funnel,
    pipeline:   Pipeline,
    contenidos: Contenidos,
    roadmap:    Roadmap,
    espana:     Espana,
    francia:    Francia,
    franciaPanel: FranciaPanel,
    petfood:    Petfood,
    conexiones: Conexiones,
    stack:      Stack,
    prompt:     Prompt,
    brightbean: BrightBean,
    chatwoot:   Chatwoot,
    factusol:   Factusol,
    pizarra:    Pizarra,
}

export default function App() {
    const [vistaActual, setVistaActual] = useState('dashboard')
    const [tema, setTema] = useState(
        () => localStorage.getItem('grenoucerie-tema') || 'oscuro'
    )
    const Componente = VISTAS[vistaActual] || Dashboard

    useEffect(() => {
        localStorage.setItem('grenoucerie-tema', tema)
    }, [tema])

    const toggleTema = () => {
        setTema(prev => prev === 'oscuro' ? 'claro' : 'oscuro')
    }

    return (
        <div className={`app-layout ${tema === 'claro' ? 'light-theme' : ''}`}>
            <Sidebar
                vistaActual={vistaActual}
                cambiarVista={setVistaActual}
                tema={tema}
                toggleTema={toggleTema}
            />
            <main className="main-content">
                <Componente cambiarVista={setVistaActual} />
            </main>
        </div>
    )
}
