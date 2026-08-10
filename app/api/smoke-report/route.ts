import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/kv';
import fs from 'fs';
import path from 'path';

declare global {
  var masterSmokeRowsCache: any[] | undefined;
  var masterSmokeRowsUpdatedAt: string | undefined;
}

const SMOKE_DATA_FILE = path.join(process.cwd(), 'data', 'smoke_reports.json');

function ensureSmokeDataFile() {
  try {
    const dir = path.dirname(SMOKE_DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {
    // Vercel serverless read-only filesystem
  }
}

export async function GET() {
  // 1. Try Upstash Redis / Vercel KV
  if (redis) {
    try {
      const rows = await redis.get<any[]>('smoke:master');
      if (rows && Array.isArray(rows)) {
        globalThis.masterSmokeRowsCache = rows;
        return NextResponse.json({
          success: true,
          smokeRows: rows,
          updatedAt: new Date().toISOString(),
          source: 'upstash-redis',
        });
      }
    } catch (e) {}
  }

  // 2. Try In-Memory Cache
  if (globalThis.masterSmokeRowsCache && globalThis.masterSmokeRowsCache.length > 0) {
    return NextResponse.json({
      success: true,
      smokeRows: globalThis.masterSmokeRowsCache,
      updatedAt: globalThis.masterSmokeRowsUpdatedAt || new Date().toISOString(),
      source: 'memory',
    });
  }

  // 3. Fallback to Local JSON File
  ensureSmokeDataFile();
  try {
    if (fs.existsSync(SMOKE_DATA_FILE)) {
      const content = fs.readFileSync(SMOKE_DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content || '{}');
      if (parsed.smokeRows && Array.isArray(parsed.smokeRows)) {
        globalThis.masterSmokeRowsCache = parsed.smokeRows;
        globalThis.masterSmokeRowsUpdatedAt = parsed.updatedAt;
        return NextResponse.json({
          success: true,
          smokeRows: parsed.smokeRows,
          updatedAt: parsed.updatedAt,
          source: 'file',
        });
      }
    }
  } catch (err) {}

  return NextResponse.json({ success: true, smokeRows: [], source: 'none' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const smokeRows = Array.isArray(body) ? body : body.smokeRows;

    if (!Array.isArray(smokeRows)) {
      return NextResponse.json({ success: false, error: 'Invalid smoke rows array' }, { status: 400 });
    }

    const updatedAt = new Date().toISOString();
    globalThis.masterSmokeRowsCache = smokeRows;
    globalThis.masterSmokeRowsUpdatedAt = updatedAt;

    // 1. Save to Upstash Redis / Vercel KV
    if (redis) {
      try {
        await redis.set('smoke:master', smokeRows);
      } catch (e) {}
    }

    // 2. Save to Local JSON File
    try {
      ensureSmokeDataFile();
      fs.writeFileSync(
        SMOKE_DATA_FILE,
        JSON.stringify({ updatedAt, smokeRows }, null, 2),
        'utf-8'
      );
    } catch (e) {
      // Vercel serverless read-only filesystem fallback handled by memory store
    }

    return NextResponse.json({ success: true, message: 'Smoke rows saved successfully', updatedAt });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
