// src/app/api/debug/aeat/test-hosts/route.ts
// Prueba diferentes hostnames de AEAT

import { NextResponse } from "next/server";
import { request as httpRequest } from 'https';

async function testHost(hostname: string): Promise<{ success: boolean; error?: string; statusCode?: string }> {
  return new Promise((resolve) => {
    const options = {
      hostname,
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 5000,
    };

    const req = httpRequest(options, (res) => {
      resolve({ success: true, statusCode: res.statusCode?.toString() });
    });

    req.on('error', (e: any) => {
      resolve({ success: false, error: e.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    req.setTimeout(5000);
    req.end();
  });
}

export async function GET() {
  const hosts = [
    'www1.agenciatributaria.es',
    'www2.agenciatributaria.es',
    'www.agenciatributaria.es',
    'www1.aeat.es',
    'www2.aeat.es',
    'www.aeat.es',
  ];

  const results: any = {};

  for (const host of hosts) {
    results[host] = await testHost(host);
  }

  // También probar resolución DNS directa
  const dnsResults: any = {};

  return NextResponse.json({
    hosts,
    results,
    summary: {
      working: Object.entries(results).filter(([_, r]: any) => r.success).map(([h]) => h),
      failing: Object.entries(results).filter(([_, r]: any) => !r.success).map(([h, r]: any) => ({ host: h, error: r.error })),
    }
  });
}
