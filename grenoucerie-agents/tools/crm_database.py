"""
Herramienta de base de datos para los agentes de Grenoucerie.
Lee y escribe en el PostgreSQL del CRM (Supabase).
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

# Motor de base de datos compartido
_engine = None

def get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    return _engine


def obtener_leads_recientes(dias: int = 7) -> list[dict]:
    """Devuelve los leads creados en los últimos N días."""
    desde = datetime.utcnow() - timedelta(days=dias)
    with get_engine().connect() as conn:
        resultado = conn.execute(text("""
            SELECT id, "firstName", "lastName", email, company,
                   status, "leadSource", "assigned_to", "createdAt"
            FROM crm_Leads
            WHERE "createdAt" >= :desde
            ORDER BY "createdAt" DESC
            LIMIT 100
        """), {"desde": desde})
        return [dict(row._mapping) for row in resultado]


def obtener_contactos_sin_actividad(dias: int = 14) -> list[dict]:
    """Devuelve contactos sin actividad en los últimos N días."""
    desde = datetime.utcnow() - timedelta(days=dias)
    with get_engine().connect() as conn:
        resultado = conn.execute(text("""
            SELECT c.id, c."firstName", c."lastName", c.email,
                   c.assigned_to, c."updatedAt",
                   a.name as account_name
            FROM crm_Contacts c
            LEFT JOIN crm_Accounts a ON c.account_id = a.id
            WHERE c."updatedAt" < :desde
            AND c.status != 'Inactive'
            ORDER BY c."updatedAt" ASC
            LIMIT 50
        """), {"desde": desde})
        return [dict(row._mapping) for row in resultado]


def obtener_actividad_semanal() -> dict:
    """Resumen de actividad de la última semana por mercado/estado."""
    desde = datetime.utcnow() - timedelta(days=7)
    with get_engine().connect() as conn:
        # Leads nuevos
        leads = conn.execute(text("""
            SELECT COUNT(*) as total FROM crm_Leads
            WHERE "createdAt" >= :desde
        """), {"desde": desde}).scalar()

        # Oportunidades activas
        oportunidades = conn.execute(text("""
            SELECT COUNT(*) as total, SUM(amount) as valor_total
            FROM crm_Opportunities
            WHERE "updatedAt" >= :desde AND status NOT IN ('Closed Lost', 'Closed Won')
        """), {"desde": desde}).fetchone()

        # Tareas completadas
        tareas = conn.execute(text("""
            SELECT COUNT(*) as total FROM crm_Accounts_Tasks
            WHERE "updatedAt" >= :desde AND status = 'Done'
        """), {"desde": desde}).scalar()

    return {
        "periodo": f"Últimos 7 días ({desde.strftime('%d/%m/%Y')} - hoy)",
        "leads_nuevos": leads or 0,
        "oportunidades_activas": oportunidades[0] if oportunidades else 0,
        "valor_pipeline": float(oportunidades[1] or 0) if oportunidades else 0,
        "tareas_completadas": tareas or 0,
    }


def guardar_puntuacion_lead(lead_id: str, puntuacion: int, resumen: str) -> bool:
    """Guarda la puntuación del agente de calificación en el lead."""
    with get_engine().connect() as conn:
        conn.execute(text("""
            UPDATE crm_Leads
            SET description = CONCAT(
                '[IA - Puntuación: ', :puntuacion, '/10] ', :resumen,
                '\n\n', COALESCE(description, '')
            ),
            "updatedAt" = NOW()
            WHERE id = :lead_id
        """), {"lead_id": lead_id, "puntuacion": puntuacion, "resumen": resumen})
        conn.commit()
    return True


def crear_tarea_seguimiento(contact_id: str, titulo: str, descripcion: str, dias_para_vencer: int = 3) -> bool:
    """Crea una tarea de seguimiento para un contacto."""
    vencimiento = datetime.utcnow() + timedelta(days=dias_para_vencer)
    with get_engine().connect() as conn:
        conn.execute(text("""
            INSERT INTO crm_Accounts_Tasks
            (id, title, description, status, priority, "dueDate", "createdAt", "updatedAt")
            VALUES (
                gen_random_uuid()::text,
                :titulo,
                :descripcion,
                'To Do',
                'Medium',
                :vencimiento,
                NOW(),
                NOW()
            )
        """), {
            "titulo": titulo,
            "descripcion": descripcion,
            "vencimiento": vencimiento,
        })
        conn.commit()
    return True
