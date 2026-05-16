"""
Agente 3 — Resumen semanal
Se activa cuando el CRM llama a GET /weekly-summary

Genera un informe de actividad de la semana por mercado:
- España (gamas premium)
- Francia (expansión)
- Petfood (línea nueva)

Devuelve el resumen en texto para guardarlo en el CRM.
"""

import os
from crewai import Agent, Task, Crew, Process, LLM
from tools.crm_database import obtener_actividad_semanal, obtener_leads_recientes
from dotenv import load_dotenv

load_dotenv()

llm = LLM(
    model=f"openai/{os.getenv('OPENAI_MODEL_NAME', 'deepseek/deepseek-chat')}",
    base_url=os.getenv("OPENAI_API_BASE", "https://openrouter.ai/api/v1"),
    api_key=os.getenv("OPENROUTER_API_KEY", ""),
)


def generar_resumen_semanal() -> dict:
    """
    Genera el resumen semanal de actividad comercial de Grenoucerie.

    Returns:
        dict con 'resumen_texto', 'metricas', 'fecha_generacion'
    """

    from datetime import datetime

    # Obtener datos reales de la BD
    metricas = obtener_actividad_semanal()
    leads_recientes = obtener_leads_recientes(dias=7)

    agente_analista = Agent(
        role="Analista Comercial de Grenoucerie",
        goal=(
            "Generar resúmenes semanales claros y accionables para el CEO de Grenoucerie (Fabián). "
            "El informe debe ser directo, sin relleno, y destacar lo que importa."
        ),
        backstory=(
            "Eres el analista interno de FEROD / Grenoucerie. "
            "Conoces la estrategia: consolidar España (4 gamas), expandir a Francia (×20), lanzar Petfood. "
            "El CEO necesita saber qué se movió de verdad esta semana, qué está bloqueado, "
            "y cuál es la prioridad de la próxima semana. Sin rodeos."
        ),
        llm=llm,
        verbose=False,
        allow_delegation=False,
    )

    # Preparar contexto con datos reales
    leads_texto = ""
    if leads_recientes:
        for lead in leads_recientes[:10]:
            nombre = f"{lead.get('firstName', '')} {lead.get('lastName', '')}".strip()
            empresa = lead.get("company", "—")
            leads_texto += f"  - {nombre} ({empresa})\n"
    else:
        leads_texto = "  - Sin leads nuevos esta semana\n"

    tarea = Task(
        description=(
            f"Genera el informe semanal de Grenoucerie con estos datos reales:\n\n"
            f"MÉTRICAS DE LA SEMANA:\n"
            f"- Período: {metricas['periodo']}\n"
            f"- Leads nuevos: {metricas['leads_nuevos']}\n"
            f"- Oportunidades activas en pipeline: {metricas['oportunidades_activas']}\n"
            f"- Valor total pipeline: {metricas['valor_pipeline']:.2f} €\n"
            f"- Tareas completadas: {metricas['tareas_completadas']}\n\n"
            f"LEADS NUEVOS ESTA SEMANA:\n{leads_texto}\n"
            f"CONTEXTO ESTRATÉGICO:\n"
            f"- España: consolidar 4 gamas, margen y volumen\n"
            f"- Francia: expansión prioritaria, sin distribuidor confirmado aún\n"
            f"- Petfood: línea nueva, fase inicial\n\n"
            f"FORMATO REQUERIDO (en español, sin markdown complejo):\n"
            f"=== RESUMEN SEMANAL GRENOUCERIE — [FECHA] ===\n\n"
            f"QUÉ SE MOVIÓ:\n[máx. 4 puntos concretos]\n\n"
            f"ESTADO POR MERCADO:\n"
            f"• España: ...\n"
            f"• Francia: ...\n"
            f"• Petfood: ...\n\n"
            f"PRIORIDAD PRÓXIMA SEMANA:\n[1 sola prioridad — la más importante]\n\n"
            f"ALERTA / RIESGO:\n[si hay algo que merece atención inmediata, si no: 'Sin alertas']"
        ),
        expected_output="Informe semanal estructurado en texto plano, listo para enviar.",
        agent=agente_analista,
    )

    crew = Crew(
        agents=[agente_analista],
        tasks=[tarea],
        process=Process.sequential,
        verbose=False,
    )

    resumen = str(crew.kickoff())

    return {
        "resumen_texto": resumen,
        "metricas": metricas,
        "fecha_generacion": datetime.utcnow().isoformat(),
        "leads_analizados": len(leads_recientes),
    }
