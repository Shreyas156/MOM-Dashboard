import { NextRequest, NextResponse } from 'next/server';
import { fetchMOMFromN8n, saveMOMToN8n } from '@/lib/n8n';
import fs from 'fs';
import path from 'path';

declare global {
  var momGlobalStore: Record<string, any> | undefined;
  var masterSmokeRowsCache: any[] | undefined;
  var masterSmokeRowsUpdatedAt: string | undefined;
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
    // Vercel serverless read-only protection
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

// Server-side smart merger to prevent concurrent edits from overwriting each other
function mergeServerMOM(existing: any, incoming: any): any {
  if (!existing || !existing.qaTasks) return incoming;

  const merged = { ...existing, ...incoming };

  if (Array.isArray(incoming.qaTasks) && Array.isArray(existing.qaTasks)) {
    const existingQaMap = new Map<string, any>();
    existing.qaTasks.forEach((q: any) => existingQaMap.set(q.qaId, q));

    merged.qaTasks = incoming.qaTasks.map((incQA: any) => {
      const extQA = existingQaMap.get(incQA.qaId);
      if (!extQA) return incQA;

      // Retain submitted state if either has submitted it
      const isSubmitted = incQA.isSubmitted || extQA.isSubmitted;
      const submittedAt = incQA.submittedAt || extQA.submittedAt;

      // Prefer non-empty tasks list
      let tasks = incQA.tasks;
      if (!tasks || tasks.length === 0) {
        tasks = extQA.tasks || [];
      }

      return {
        ...extQA,
        ...incQA,
        isSubmitted,
        submittedAt,
        tasks,
      };
    });

    // Retain any QAs from existing that weren't in incoming
    existing.qaTasks.forEach((extQA: any) => {
      if (!merged.qaTasks.some((q: any) => q.qaId === extQA.qaId)) {
        merged.qaTasks.push(extQA);
      }
    });
  }

  // Merge smoke rows preserving filled values
  if (Array.isArray(incoming.smokeRows) && Array.isArray(existing.smokeRows)) {
    const existingSmokeMap = new Map<string, any>();
    existing.smokeRows.forEach((r: any) => existingSmokeMap.set(r.id, r));

    merged.smokeRows = incoming.smokeRows.map((incRow: any) => {
      const extRow = existingSmokeMap.get(incRow.id);
      if (!extRow) return incRow;

      return {
        ...extRow,
        ...incRow,
        desktopTotal: incRow.desktopTotal ?? extRow.desktopTotal,
        desktopPass: incRow.desktopPass ?? extRow.desktopPass,
        desktopFail: incRow.desktopFail ?? extRow.desktopFail,
        desktopReportUrl: incRow.desktopReportUrl || extRow.desktopReportUrl,
        desktopBugTicketId: (incRow.desktopBugTicketId && incRow.desktopBugTicketId !== '-') ? incRow.desktopBugTicketId : extRow.desktopBugTicketId,
        msiteTotal: incRow.msiteTotal ?? extRow.msiteTotal,
        msitePass: incRow.msitePass ?? extRow.msitePass,
        msiteFail: incRow.msiteFail ?? extRow.msiteFail,
        msiteReportUrl: incRow.msiteReportUrl || extRow.msiteReportUrl,
        msiteBugTicketId: (incRow.msiteBugTicketId && incRow.msiteBugTicketId !== '-') ? incRow.msiteBugTicketId : extRow.msiteBugTicketId,
      };
    });

    existing.smokeRows.forEach((extRow: any) => {
      if (!merged.smokeRows.some((r: any) => r.id === extRow.id)) {
        merged.smokeRows.push(extRow);
      }
    });
  }

  merged.updatedAt = new Date().toISOString();
  return merged;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || getTodayDateStringServer();
  const masterSmoke = getMasterSmokeRowsServer();

  // 1. Try n8n Data Table / Webhook
  try {
    const n8nData = await fetchMOMFromN8n(date);
    if (n8nData && n8nData.qaTasks) {
      if (masterSmoke && masterSmoke.length > 0) {
        n8nData.smokeRows = masterSmoke;
      }
      globalThis.momGlobalStore![date] = n8nData;
      return NextResponse.json({ success: true, data: n8nData, source: 'n8n' });
    }
  } catch (e) {}

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
  } catch (err) {}

  return NextResponse.json({ success: true, data: null, source: 'none' });
}

export async function POST(req: NextRequest) {
  try {
    const incomingData = await req.json();
    if (!incomingData || !incomingData.id) {
      return NextResponse.json({ success: false, error: 'Invalid MOM data' }, { status: 400 });
    }

    const date = incomingData.id;

    if (!globalThis.momGlobalStore) {
      globalThis.momGlobalStore = {};
    }

    let existingData = globalThis.momGlobalStore[date] || null;

    // Try fetching existing data from n8n first for accurate merging
    try {
      const n8nData = await fetchMOMFromN8n(date);
      if (n8nData && n8nData.qaTasks) {
        existingData = n8nData;
      }
    } catch (e) {}

    const finalMOMData = mergeServerMOM(existingData, incomingData);

    // Update global memory cache immediately
    globalThis.momGlobalStore[date] = finalMOMData;

    // Update master smoke rows
    if (Array.isArray(finalMOMData.smokeRows) && finalMOMData.smokeRows.length > 0) {
      globalThis.masterSmokeRowsCache = finalMOMData.smokeRows;
      globalThis.masterSmokeRowsUpdatedAt = finalMOMData.updatedAt;
      try {
        ensureDataFile();
        fs.writeFileSync(
          SMOKE_DATA_FILE,
          JSON.stringify({ updatedAt: finalMOMData.updatedAt, smokeRows: finalMOMData.smokeRows }, null, 2),
          'utf-8'
        );
      } catch (e) {}
    }

    // 1. Save to n8n Webhook / Data Table
    try {
      await saveMOMToN8n(finalMOMData);
    } catch (e) {}

    // 2. Save to Local JSON File
    try {
      ensureDataFile();
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        const store = JSON.parse(fileContent || '{}');
        store[date] = finalMOMData;
        fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
      }
    } catch (e) {}

    return NextResponse.json({ success: true, message: 'Saved successfully', data: finalMOMData });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
