"""
Agente 2 — Seguimiento inteligente
Se activa cuando el CRM llama a POST /check-followups

Revisa contactos sin actividad en los últimos N días y genera
sugerencias personalizadas de seguimiento por mercado.
Devuelve lista de recordatorios que el CRM puede crear automáticamente.
"""

import os
from crewai import Agent, Task, Crew, Process, LLM
from tools.crm_database import obtener_contactos_sin_actividad
from dotenv import load_dotenv

load_dotenv()

llm = LLM(
    model=f"openai/{os.getenv('OPENAI_MODEL_NAME', 'deepseek/deepseek-chat')}",
    base_url=os.getenv("OPENAI_API_BASE", "https://openrouter.ai/api/v1"),
    api_key=os.getenv("OPENROUTER_API_KEY", ""),
)


def generar_recordatorios_seguimiento(dias_sin_actividad: int = 14) -> list[dict]:
    """
    Analiza contactos sin actividad y genera sugerencias de seguimiento.

    Returns:
        Lista de dicts con 'contacto', 'mensaje_sugerido', 'prioridad', 'mercado'
    """

    # Obtener contactos sin actividad de la BD
    contactos = obtener_contactos_sin_actividad(dias=dias_sin_actividad)

    if not contactos:
        return []

    agente_seguimiento = Agent(
        role="Gestor de Seguimiento Comercial B2B",
        goal=(
            "Generar sugerencias de seguimiento personalizadas y accionables "
            "para el equipo comercial de Grenoucerie."
        ),
        backstory=(
            "Eres un comercial experto en el sector agroalimentario. "
            "Sabes cuándo y cómo retomar el contacto con clientes potenciales. "
            "Para Grenoucerie: el tono es profesional pero cercano. "
            "Los mercados clave son España, Francia y Petfood — cada uno con su contexto."
        ),
        llm=llm,
        verbose=False,
        allow_delegation=False,
    )

    # Preparar lista de contactos para el agente
    lista_contactos = ""
    for c in contactos[:20]:  # máximo 20 para no sobrecargar el prompt
        nombre = f"{c.get('firstName', '')} {c.get('lastName', '')}".strip()
        empresa = c.get("account_name", "empresa desconocida")
        dias = (
            (c["updatedAt"] - c["updatedAt"]).days
            if "updatedAt" in c else dias_sin_actividad
        )
        lista_contactos += f"- {nombre} ({empresa}) — sin actividad {dias_sin_actividad}+ días\n"

    tarea = Task(
        description=(
            f"Tenemos {len(contactos)} contactos sin actividad en más de {dias_sin_actividad} días.\n"
            f"Aquí los primeros 20:\n{lista_contactos}\n\n"
            f"Para cada contacto, genera un recordatorio de seguimiento con:\n"
            f"- Un mensaje corto de seguimiento (máx. 3 líneas)\n"
            f"- La prioridad sugerida (Alta / Media / Baja)\n"
            f"- El mercado inferido (España / Francia / Petfood / Sin determinar)\n\n"
            f"Formato de respuesta — un bloque por contacto:\n"
            f"CONTACTO: [nombre]\n"
            f"PRIORIDAD: [Alta/Media/Baja]\n"
            f"MERCADO: [España/Francia/Petfood/Sin determinar]\n"
            f"MENSAJE: [texto del recordatorio]\n"
            f"---"
        ),
        expected_output="Lista estructurada de recordatorios uno por contacto.",
        agent=agente_seguimiento,
    )

    crew = Crew(
        agents=[agente_seguimiento],
        tasks=[tarea],
        process=Process.sequential,
        verbose=False,
    )

    resultado = str(crew.kickoff())

    # Parsear respuesta en lista de dicts
    recordatorios = []
    bloques = resultado.split("---")

    for bloque in bloques:
        bloque = bloque.strip()
        if not bloque:
            continue

        rec = {"contacto": "", "prioridad": "Media", "mercado": "Sin determinar", "mensaje": ""}
        for linea in bloque.split("\n"):
            if linea.startswith("CONTACTO:"):
                rec["contacto"] = linea.replace("CONTACTO:", "").strip()
            elif linea.startswith("PRIORIDAD:"):
                rec["prioridad"] = linea.replace("PRIORIDAD:", "").strip()
            elif linea.startswith("MERCADO:"):
                rec["mercado"] = linea.replace("MERCADO:", "").strip()
            elif linea.startswith("MENSAJE:"):
                rec["mensaje"] = linea.replace("MENSAJE:", "").strip()

        if rec["contacto"]:
            recordatorios.append(rec)

    return recordatorios
