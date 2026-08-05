import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_MOM_DATA } from '@/lib/defaultData';
import { DailyMOM } from '@/lib/types';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'moms.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FILE_PATH)) {
    const initialMap: Record<string, DailyMOM> = {
      '2026-08-05': INITIAL_MOM_DATA,
    };
    fs.writeFileSync(FILE_PATH, JSON.stringify(initialMap, null, 2), 'utf-8');
  }
}

export async function GET(req: NextRequest) {
  try {
    ensureDataFile();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || '2026-08-05';
    
    const content = fs.readFileSync(FILE_PATH, 'utf-8');
    const momsMap: Record<string, DailyMOM> = JSON.parse(content);
    
    if (momsMap[date]) {
      return NextResponse.json({ success: true, data: momsMap[date] });
    }
    
    // Return template for requested date
    return NextResponse.json({
      success: true,
      data: {
        ...INITIAL_MOM_DATA,
        id: date,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    ensureDataFile();
    const body: DailyMOM = await req.json();
    if (!body || !body.id) {
      return NextResponse.json({ success: false, error: 'Invalid MOM data' }, { status: 400 });
    }

    const content = fs.readFileSync(FILE_PATH, 'utf-8');
    const momsMap: Record<string, DailyMOM> = JSON.parse(content);
    
    body.updatedAt = new Date().toISOString();
    momsMap[body.id] = body;
    
    fs.writeFileSync(FILE_PATH, JSON.stringify(momsMap, null, 2), 'utf-8');
    return NextResponse.json({ success: true, data: body });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
