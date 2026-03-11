// src/app/api/debug/aeat/analyze/route.ts
// Analiza bytes del certificado para encontrar problemas de codificación

import { NextResponse } from "next/server";

export async function GET() {
  const certEnv = process.env.AEAT_CERT_PEM || '';
  const keyEnv = process.env.AEAT_KEY_PEM || '';

  const result: any = {
    cert: {
      length: certEnv.length,
      firstBytes: [],
      hasBackslashN: certEnv.includes('\\n'),
      hasRealNewline: certEnv.includes('\n'),
      hasSpacesAtStart: certEnv.startsWith(' '),
      lines: [],
      hexDump: '',
    },
    key: {
      length: keyEnv.length,
      firstBytes: [],
      hasBackslashN: keyEnv.includes('\\n'),
      hasRealNewline: keyEnv.includes('\n'),
      hasSpacesAtStart: keyEnv.startsWith(' '),
      lines: [],
    },
    recommendations: [],
  };

  // Analizar certificado
  const certLines = certEnv.split('\n');
  result.cert.lines = certLines.slice(0, 5).map(line => ({
    raw: line,
    trimmed: line.trim(),
    length: line.length,
    firstChar: line.charCodeAt(0),
    bytes: Array.from(line.substring(0, 10)).map(c => c.charCodeAt(0)),
  }));

  // Primeros 200 caracteres del cert en hex
  result.cert.hexDump = Buffer.from(certEnv.substring(0, 200)).toString('hex').substring(0, 200);

  // Detectar problemas específicos
  if (result.cert.hasBackslashN && !result.cert.hasRealNewline) {
    result.recommendations.push('El cert tiene \\n literales pero no saltos de línea reales');
  }

  if (result.cert.hasSpacesAtStart) {
    result.recommendations.push('El cert comienza con espacios');
  }

  // Detectar caracteres no ASCII
  let nonAsciiCount = 0;
  for (let i = 0; i < Math.min(certEnv.length, 500); i++) {
    const code = certEnv.charCodeAt(i);
    if (code > 127) {
      nonAsciiCount++;
    }
  }
  if (nonAsciiCount > 0) {
    result.recommendations.push(`Se detectaron ${nonAsciiCount} caracteres no ASCII en los primeros 500 caracteres`);
  }

  // Verificar líneas de contenido base64
  let linesWithLeadingSpaces = 0;
  for (const line of certLines) {
    if (line.length > 0 && !line.includes('-----') && line.startsWith(' ')) {
      linesWithLeadingSpaces++;
    }
  }
  if (linesWithLeadingSpaces > 0) {
    result.recommendations.push(`${linesWithLeadingSpaces} líneas de contenido base64 tienen espacios al inicio`);
  }

  // Intentar determinar el formato correcto
  result.suggestedFormat = {
    message: 'Para Railway, el certificado debe estar en una sola línea con \\n entre cada línea',
    example: '-----BEGIN CERTIFICATE-----\\nMIIHo...\\n...\\n-----END CERTIFICATE-----',
  };

  return NextResponse.json(result);
}
