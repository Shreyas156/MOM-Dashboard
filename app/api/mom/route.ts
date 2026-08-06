import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

// Shared global memory cache across warm serverless lambdas
declare global {
  var momGlobalStore: Record<string, any> | undefined;
}

if (!globalThis.momGlobalStore) {
  globalThis.momGlobalStore = {};
}

const DATA_FILE = path.join(process.cwd(), 'data', 'moms.json');
const SMOKE_DATA_FILE = path.join(process.cwd(), 'data', 'smoke_reports.json');

function ensureDataFile() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf-8');
    }
  } catch (e) {
    // Vercel serverless read-only filesystem protection
  }
}

function getMasterSmokeRowsServer(): any[] | null {
  if (globalThis.masterSmokeRowsCache && globalThis.masterSmokeRowsCache.length > 0) {
    return globalThis.masterSmokeRowsCache;
  }
  try {
    if (fs.existsSync(SMOKE_DATA_FILE)) {
      const content = fs.readFileSync(SMOKE_DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content || '{}');
      if (parsed.smokeRows && Array.isArray(parsed.smokeRows) && parsed.smokeRows.length > 0) {
        globalThis.masterSmokeRowsCache = parsed.smokeRows;
        return parsed.smokeRows;
      }
    }
  } catch (e) {}
  return null;
}

function getTodayDateStringServer(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || getTodayDateStringServer();
  const masterSmoke = getMasterSmokeRowsServer();

  // 1. Try Supabase Cloud DB (Best for multi-device sync)
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('moms')
        .select('*')
        .eq('id', date)
        .single();

      if (!error && data && data.data) {
        const responseData = { ...data.data };
        if (masterSmoke && masterSmoke.length > 0) {
          responseData.smokeRows = masterSmoke;
        }
        // Also update memory cache
        globalThis.momGlobalStore![date] = responseData;
        return NextResponse.json({ success: true, data: responseData, source: 'supabase' });
      }
    } catch (e) {
      // Fall through to memory / file cache
    }
  }

  // 2. Try Shared In-Memory Store
  if (globalThis.momGlobalStore && globalThis.momGlobalStore[date]) {
    const responseData = { ...globalThis.momGlobalStore[date] };
    if (masterSmoke && masterSmoke.length > 0) {
      responseData.smokeRows = masterSmoke;
    }
    return NextResponse.json({
      success: true,
      data: responseData,
      source: 'memory',
    });
  }

  // 3. Fallback to Local JSON File
  ensureDataFile();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
      const store = JSON.parse(fileContent || '{}');
      const dateData = store[date] || null;
      if (dateData) {
        if (masterSmoke && masterSmoke.length > 0) {
          dateData.smokeRows = masterSmoke;
        }
        globalThis.momGlobalStore![date] = dateData;
      }
      return NextResponse.json({ success: true, data: dateData, source: 'file' });
    }
  } catch (err) {
    // Return empty
  }

  return NextResponse.json({ success: true, data: null, source: 'none' });
}

export async function POST(req: NextRequest) {
  try {
    const momData = await req.json();
    if (!momData || !momData.id) {
      return NextResponse.json({ success: false, error: 'Invalid MOM data' }, { status: 400 });
    }

    const date = momData.id;
    momData.updatedAt = new Date().toISOString();

    // Always update global memory cache immediately
    if (!globalThis.momGlobalStore) {
      globalThis.momGlobalStore = {};
    }
    globalThis.momGlobalStore[date] = momData;

    // Update master smoke rows if provided
    if (Array.isArray(momData.smokeRows) && momData.smokeRows.length > 0) {
      globalThis.masterSmokeRowsCache = momData.smokeRows;
      globalThis.masterSmokeRowsUpdatedAt = momData.updatedAt;
      try {
        ensureDataFile();
        fs.writeFileSync(
          SMOKE_DATA_FILE,
          JSON.stringify({ updatedAt: momData.updatedAt, smokeRows: momData.smokeRows }, null, 2),
          'utf-8'
        );
      } catch (e) {}
    }

    // 1. Save to Supabase Cloud DB if keys are present
    if (supabase) {
      try {
        await supabase.from('moms').upsert({
          id: date,
          date_formatted: momData.dateFormatted,
          data: momData,
          updated_at: momData.updatedAt,
        });

        if (Array.isArray(momData.smokeRows) && momData.smokeRows.length > 0) {
          await supabase.from('smoke_reports').upsert({
            id: 'master',
            rows: momData.smokeRows,
            updated_at: momData.updatedAt,
          });
        }
      } catch (e) {
        // Fall through
      }
    }

    // 2. Save to Local JSON File (if local environment)
    try {
      ensureDataFile();
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        const store = JSON.parse(fileContent || '{}');
        store[date] = momData;
        fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
      }
    } catch (e) {
      // Vercel serverless read-only filesystem fallback handled by memory store
    }

    return NextResponse.json({ success: true, message: 'Saved successfully', data: momData });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
