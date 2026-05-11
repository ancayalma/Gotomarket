import { useState } from 'react';

export default function GenerarPost() {
    const [estadoRedes, setEstadoRedes] = useState({
        linkedin: false,
        instagram: false,
        facebook: false
    });

    const [idea, setIdea] = useState("");
    const [postGenerado, setPostGenerado] = useState("");
    const [generando, setGenerando] = useState(false);

    const conectarRed = (red) => {
        // Simulamos la conexión
        setEstadoRedes(prev => ({ ...prev, [red]: true }));
    };

    const generarPost = () => {
        if (!idea) return;
        setGenerando(true);
        // Simulamos el retraso de una API/n8n
        setTimeout(() => {
            const resultado = `🚀 ¡La revolución en la cocina profesional ya está aquí!\n\nHoy quiero hablarles sobre un tema vital para el sector: ${idea}.\n\nNo se trata solo de innovación en el plato, sino de eficiencia, trazabilidad y rentabilidad para sus negocios. Hemos adaptado nuestras prácticas para asegurar que cada producto aporte el máximo valor.\n\n👉 Escríbeme un mensaje directo si quieres que charlemos sobre cómo implementarlo y escalar tus márgenes.\n\n#Innovacion #B2B #Rentabilidad #Gastronomia`;
            setPostGenerado(resultado);
            setGenerando(false);
        }, 2000);
    };

    const publicar = () => {
        const redesConectadas = Object.keys(estadoRedes).filter(key => estadoRedes[key]);
        if (redesConectadas.length === 0) {
            alert("⚠️ Por favor, enlaza al menos una red social arriba antes de publicar.");
            return;
        }
        alert(`¡Post enviado con éxito a: ${redesConectadas.join(', ')}! 🚀`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card" style={{ borderTop: '3px solid var(--pistacho)' }}>
                <h3 style={{ color: 'var(--pistacho)', marginBottom: '16px' }}>🔗 1. Enlazar Redes Sociales</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    Conecta tus cuentas para poder publicar directamente desde este centro de mando.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => conectarRed('linkedin')}
                        style={{
                            padding: '12px 20px',
                            borderRadius: '8px',
                            border: estadoRedes.linkedin ? '2px solid var(--pistacho)' : '1px solid var(--border)',
                            background: estadoRedes.linkedin ? 'rgba(147, 197, 114, 0.1)' : 'var(--bg-glass)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span>💼 LinkedIn</span>
                        {estadoRedes.linkedin && <span style={{ color: 'var(--pistacho)' }}>✓ Conectado</span>}
                    </button>
                    <button
                        onClick={() => conectarRed('instagram')}
                        style={{
                            padding: '12px 20px',
                            borderRadius: '8px',
                            border: estadoRedes.instagram ? '2px solid var(--pistacho)' : '1px solid var(--border)',
                            background: estadoRedes.instagram ? 'rgba(147, 197, 114, 0.1)' : 'var(--bg-glass)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span>📸 Instagram</span>
                        {estadoRedes.instagram && <span style={{ color: 'var(--pistacho)' }}>✓ Conectado</span>}
                    </button>
                    <button
                        onClick={() => conectarRed('facebook')}
                        style={{
                            padding: '12px 20px',
                            borderRadius: '8px',
                            border: estadoRedes.facebook ? '2px solid var(--pistacho)' : '1px solid var(--border)',
                            background: estadoRedes.facebook ? 'rgba(147, 197, 114, 0.1)' : 'var(--bg-glass)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span>👥 Facebook</span>
                        {estadoRedes.facebook && <span style={{ color: 'var(--pistacho)' }}>✓ Conectado</span>}
                    </button>
                </div>
            </div>

            <div className="card" style={{ borderTop: '3px solid var(--oliva)' }}>
                <h3 style={{ color: 'var(--oliva-light)', marginBottom: '16px' }}>✍️ 2. Generador de Post con IA</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    Escribe una idea breve. Nuestra Inteligencia Artificial aplicará los mejores "hacks" de persuasión para crear un texto irresistible.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <textarea
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                        placeholder="Ejemplo: Las ranas de granja son más ecológicas que la carne tradicional y aumentan los márgenes del restaurante..."
                        style={{
                            width: '100%',
                            minHeight: '100px',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-dark)',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                        }}
                    />
                    <button
                        onClick={generarPost}
                        disabled={!idea || generando}
                        className="btn btn-primary"
                        style={{
                            alignSelf: 'flex-start',
                            background: (!idea || generando) ? 'var(--border)' : 'var(--oliva)',
                            color: 'white',
                            cursor: (!idea || generando) ? 'not-allowed' : 'pointer',
                            opacity: (!idea || generando) ? 0.7 : 1
                        }}
                    >
                        {generando ? '🧠 Pensando y redactando...' : '✨ Autogenerar post'}
                    </button>
                </div>
            </div>

            {postGenerado && (
                <div className="card" style={{ borderTop: '3px solid var(--salvia)' }}>
                    <h3 style={{ color: 'var(--salvia)', marginBottom: '16px' }}>📱 3. Revisión y Publicación</h3>
                    <textarea
                        value={postGenerado}
                        onChange={(e) => setPostGenerado(e.target.value)}
                        style={{
                            width: '100%',
                            minHeight: '220px',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: 'rgba(0,0,0,0.2)',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            marginBottom: '16px',
                            lineHeight: '1.5'
                        }}
                    />

                    <div style={{
                        padding: '12px',
                        background: 'rgba(147, 197, 114, 0.1)',
                        border: '1px solid rgba(147, 197, 114, 0.3)',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        fontSize: '13px',
                        color: 'var(--text-primary)'
                    }}>
                        <strong>💡 Consejo de Marketing:</strong> Revisa el texto y asegúrate de que tiene un tono humano y cercano. Modifica lo que necesites antes de publicar.
                    </div>

                    <button
                        onClick={publicar}
                        className="btn btn-primary"
                        style={{
                            background: 'var(--pistacho)',
                            color: '#1a1d24',
                            fontWeight: 'bold',
                            padding: '14px 24px',
                            fontSize: '16px',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        🚀 Publicar ahora
                    </button>
                </div>
            )}
        </div>
    );
}
