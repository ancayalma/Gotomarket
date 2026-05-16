import { NextResponse } from "next/server";

// Ruta de Stripe desactivada — Grenoucerie CRM no usa pagos externos
export async function GET() {
  return NextResponse.json({ error: "Pagos externos no disponibles" }, { status: 404 });
}
export async function POST() {
  return NextResponse.json({ error: "Pagos externos no disponibles" }, { status: 404 });
}

