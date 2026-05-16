"""
Agente 1 — Calificación de leads
Se activa cuando el CRM llama a POST /qualify-lead

Evalúa si un lead es prometedor para Grenoucerie según:
- Mercado objetivo (España, Francia, Petfood)
- Completitud de datos de contacto
- Empresa e industria
- Historial de interacción

Devuelve: puntuación 1-10 + resumen de 2 líneas
"""

import os
from crewai import Agent, Task, Crew, Process, LLM
from dotenv import load_dotenv

load_dotenv()

# Configuración del LLM — OpenRouter con modelo gratuito
llm = LLM(
    model=f"openai/{os.getenv('OPENAI_MODEL_NAME', 'deepseek/deepseek-chat')}",
    base_url=os.getenv("OPENAI_API_BASE", "https://openrouter.ai/api/v1"),
    api_key=os.getenv("OPENROUTER_API_KEY", ""),
)


def calificar_lead(datos_lead: dict) -> dict:
    """
    Califica un lead y devuelve puntuación + resumen.

    Args:
        datos_lead: dict con los campos del lead del CRM

    Returns:
        dict con 'puntuacion' (int 1-10) y 'resumen' (str 2 líneas)
    """

    # Agente calificador especializado en el negocio de Grenoucerie
    calificador = Agent(
        role="Especialista en Calificación de Leads B2B",
        goal=(
            "Evaluar leads para Grenoucerie (empresa de ranicultura y transformación alimentaria). "
            "Identificar cuáles tienen mayor potencial de conversión en España, Francia o Petfood."
        ),
        backstory=(
            "Eres un experto en ventas B2B del sector agroalimentario. "
            "Conoces perfectamente el perfil de cliente ideal de Grenoucerie: "
            "restaurantes, distribuidores, importadores, tiendas gourmet, fabricantes de petfood. "
            "Sabes que el mercado francés es prioritario para expansión. "
            "Evalúas leads con criterio práctico y sin rodeos."
        ),
        llm=llm,
        verbose=False,
        allow_delegation=False,
    )

    # Contexto del lead formateado
    contexto_lead = "\n".join([f"- {k}: {v}" for k, v in datos_lead.items() if v])

    tarea = Task(
        description=(
            f"Analiza este lead y califica su potencial para Grenoucerie:\n\n"
            f"{contexto_lead}\n\n"
            f"Grenoucerie vende: ancas de rana transformadas y productos derivados.\n"
            f"Mercados: España (gamas premium), Francia (expansión ×20), Petfood (línea nueva).\n\n"
            f"Responde EXACTAMENTE en este formato (sin texto adicional):\n"
            f"PUNTUACION: [número del 1 al 10]\n"
            f"RESUMEN: [máximo 2 líneas explicando el potencial y el motivo de la puntuación]"
        ),
        expected_output=(
            "Exactamente dos líneas:\n"
            "PUNTUACION: [1-10]\n"
            "RESUMEN: [2 líneas máximo]"
        ),
        agent=calificador,
    )

    crew = Crew(
        agents=[calificador],
        tasks=[tarea],
        process=Process.sequential,
        verbose=False,
    )

    resultado = crew.kickoff()
    texto = str(resultado).strip()

    # Parsear respuesta
    puntuacion = 5  # default
    resumen = texto

    for linea in texto.split("\n"):
        if linea.startswith("PUNTUACION:"):
            try:
                puntuacion = int(linea.replace("PUNTUACION:", "").strip())
                puntuacion = max(1, min(10, puntuacion))
            except ValueError:
                pass
        elif linea.startswith("RESUMEN:"):
            resumen = linea.replace("RESUMEN:", "").strip()

    return {
        "puntuacion": puntuacion,
        "resumen": resumen,
        "texto_completo": texto,
    }
