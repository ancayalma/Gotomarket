"""
Grenoucerie Agents — Microservicio de agentes IA
FastAPI + CrewAI + OpenRouter

Endpoints:
  POST /qualify-lead      → Calificar un lead nuevo (puntuación 1-10)
  POST /check-followups   → Revisar contactos sin actividad y sugerir seguimientos
  GET  /weekly-summary    → Generar resumen semanal por mercado
  GET  /health            → Estado del servicio
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

# Importar los agentes
from crews.lead_qualification import calificar_lead
from crews.followup_reminder import generar_recordatorios_seguimiento
from crews.weekly_summary import generar_resumen_semanal
from tools.crm_database import guardar_puntuacion_lead, crear_tarea_seguimiento

# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Grenoucerie Agents API",
    description="Microservicio de agentes IA para el CRM de Grenoucerie / FEROD 2019 S.L.",
    version="1.0.0",
)

# CORS — permite llamadas desde el CRM
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("CRM_URL", "http://localhost:3000"),
        "https://grenoucerie-platform.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# Modelos de datos
# ─────────────────────────────────────────────────────────────────────────────

class DatosLead(BaseModel):
    lead_id: Optional[str] = None
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    email: Optional[str] = None
    empresa: Optional[str] = None
    telefono: Optional[str] = None
    origen: Optional[str] = None    # fuente del lead: web, feria, referido...
    mercado: Optional[str] = None   # España, Francia, Petfood
    notas: Optional[str] = None
    guardar_en_crm: bool = True     # si True, guarda la puntuación en el CRM

class ConfiguracionSeguimiento(BaseModel):
    dias_sin_actividad: int = 14    # días sin contacto para activar el seguimiento
    crear_tareas: bool = False      # si True, crea tareas en el CRM automáticamente


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    """Comprueba que el servicio está activo."""
    return {
        "status": "ok",
        "servicio": "Grenoucerie Agents",
        "version": "1.0.0",
        "modelo_llm": os.getenv("OPENAI_MODEL_NAME", "deepseek/deepseek-chat"),
        "proveedor": "OpenRouter",
    }


@app.post("/qualify-lead")
def endpoint_calificar_lead(datos: DatosLead):
    """
    Califica un lead nuevo.

    El CRM envía los datos del contacto y recibe:
    - puntuacion: int (1-10)
    - resumen: str (2 líneas)

    Si guardar_en_crm=True y hay lead_id, actualiza el registro en la BD.
    """
    try:
        # Convertir a dict limpio para el agente
        datos_para_agente = {
            "Nombre": f"{datos.nombre or ''} {datos.apellido or ''}".strip(),
            "Email": datos.email or "—",
            "Empresa": datos.empresa or "—",
            "Teléfono": datos.telefono or "—",
            "Origen del lead": datos.origen or "—",
            "Mercado objetivo": datos.mercado or "—",
            "Notas adicionales": datos.notas or "—",
        }

        resultado = calificar_lead(datos_para_agente)

        # Guardar en el CRM si se pidió y hay ID
        if datos.guardar_en_crm and datos.lead_id:
            guardar_puntuacion_lead(
                lead_id=datos.lead_id,
                puntuacion=resultado["puntuacion"],
                resumen=resultado["resumen"],
            )

        return {
            "ok": True,
            "lead_id": datos.lead_id,
            "puntuacion": resultado["puntuacion"],
            "resumen": resultado["resumen"],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al calificar el lead: {str(e)}")


@app.post("/check-followups")
def endpoint_seguimientos(config: ConfiguracionSeguimiento = ConfiguracionSeguimiento()):
    """
    Revisa contactos sin actividad y genera sugerencias de seguimiento.

    Devuelve lista de recordatorios con:
    - contacto: nombre del contacto
    - prioridad: Alta / Media / Baja
    - mercado: España / Francia / Petfood
    - mensaje: texto de seguimiento sugerido
    """
    try:
        recordatorios = generar_recordatorios_seguimiento(
            dias_sin_actividad=config.dias_sin_actividad
        )

        # Crear tareas en el CRM si se pidió
        if config.crear_tareas:
            for rec in recordatorios:
                if rec.get("prioridad") == "Alta":
                    crear_tarea_seguimiento(
                        contact_id="",  # sin ID de contacto por ahora
                        titulo=f"Seguimiento: {rec['contacto']}",
                        descripcion=rec["mensaje"],
                        dias_para_vencer=2 if rec["prioridad"] == "Alta" else 5,
                    )

        return {
            "ok": True,
            "total_recordatorios": len(recordatorios),
            "dias_sin_actividad": config.dias_sin_actividad,
            "recordatorios": recordatorios,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al revisar seguimientos: {str(e)}")


@app.get("/weekly-summary")
def endpoint_resumen_semanal():
    """
    Genera el resumen semanal de actividad comercial de Grenoucerie.

    Devuelve:
    - resumen_texto: str (informe listo para leer/enviar)
    - metricas: dict con datos numéricos de la semana
    - fecha_generacion: str ISO
    """
    try:
        resultado = generar_resumen_semanal()
        return {
            "ok": True,
            **resultado,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar el resumen: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# Arranque local
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    print("🐸 Grenoucerie Agents iniciando en http://localhost:8000")
    print(f"   Modelo: {os.getenv('OPENAI_MODEL_NAME', 'deepseek/deepseek-chat')}")
    print(f"   Proveedor: {os.getenv('OPENAI_API_BASE', 'https://openrouter.ai/api/v1')}")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
