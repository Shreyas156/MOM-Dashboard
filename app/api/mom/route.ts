import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'moms.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf-8');
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || '2026-08-05';

  // 1. Try Supabase Database if configured
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('moms')
        .select('*')
        .eq('id', date)
        .single();

      if (!error && data && data.data) {
        return NextResponse.json({ success: true, data: data.data, source: 'supabase' });
      }
    } catch (e) {
      // Fall through to file fallback
    }
  }

  // 2. Fallback to Local JSON File
  ensureDataFile();
  try {
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
    const store = JSON.parse(fileContent || '{}');
    const dateData = store[date] || null;
    return NextResponse.json({ success: true, data: dateData, source: 'file' });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const momData = await req.json();
    if (!momData || !momData.id) {
      return NextResponse.json({ success: false, error: 'Invalid MOM data' }, { status: 400 });
    }

    const date = momData.id;
    momData.updatedAt = new Date().toISOString();

    // 1. Save to Supabase Database if configured
    if (supabase) {
      try {
        await supabase.from('moms').upsert({
          id: date,
          date_formatted: momData.dateFormatted,
          data: momData,
          updated_at: momData.updatedAt,
        });
      } catch (e) {
        // Fall through to file
      }
    }

    // 2. Save to Local JSON File
    ensureDataFile();
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
    const store = JSON.parse(fileContent || '{}');
    store[date] = momData;
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');

    return NextResponse.json({ success: true, message: 'Saved successfully', data: momData });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
