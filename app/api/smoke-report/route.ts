import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
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
  // 1. Try MongoDB Atlas
  try {
    const db = await getDatabase();
    if (db) {
      const doc = await db.collection('smoke_reports').findOne({ id: 'master' });
      if (doc && doc.rows) {
        globalThis.masterSmokeRowsCache = doc.rows;
        globalThis.masterSmokeRowsUpdatedAt = doc.updatedAt;
        return NextResponse.json({
          success: true,
          smokeRows: doc.rows,
          updatedAt: doc.updatedAt,
          source: 'mongodb',
        });
      }
    }
  } catch (e) {}

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

    // 1. Save to MongoDB Atlas
    try {
      const db = await getDatabase();
      if (db) {
        await db.collection('smoke_reports').updateOne(
          { id: 'master' },
          { $set: { id: 'master', rows: smokeRows, updatedAt } },
          { upsert: true }
        );
      }
    } catch (e) {}

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
