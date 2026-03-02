import { NextResponse } from "next/server";

// Este endpoint ya no se usa - la subida se hace directamente desde el cliente
// Se mantiene por compatibilidad pero la subida real es client-side
export async function POST(request: Request) {
  return NextResponse.json({
    success: false,
    error: "Este endpoint está obsoleto. Usa la subida directa desde el cliente."
  }, { status: 410 });
}
