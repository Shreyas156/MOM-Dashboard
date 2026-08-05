import { DailyMOM, QA, ModuleItem } from './types';
import { INITIAL_MOM_DATA, DEFAULT_QAS, DEFAULT_MODULES } from './defaultData';

const MOM_STORAGE_KEY_PREFIX = 'mom_dashboard_data_';
const QAS_STORAGE_KEY = 'mom_dashboard_qas';
const MODULES_STORAGE_KEY = 'mom_dashboard_modules';

export function getStoredMOM(dateStr: string): DailyMOM {
  let mom: DailyMOM = {
    ...INITIAL_MOM_DATA,
    id: dateStr,
    dateFormatted: formatDateString(dateStr),
  };

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${MOM_STORAGE_KEY_PREFIX}${dateStr}`);
      if (raw) {
        mom = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading MOM from localStorage:', e);
    }
  }

  // Filter out Sukanya Sharma if present in old stored data
  if (mom && mom.qaTasks) {
    mom.qaTasks = mom.qaTasks.filter(
      (q) => q.qaId !== '1' && q.qaName.toLowerCase() !== 'sukanya sharma'
    );
  }
  if (mom && mom.attendees) {
    mom.attendees = mom.attendees.filter(
      (name) => name.toLowerCase() !== 'sukanya sharma'
    );
  }

  return mom;
}

export function saveStoredMOM(mom: DailyMOM): void {
  if (typeof window === 'undefined') return;
  try {
    mom.updatedAt = new Date().toISOString();
    // Ensure Sukanya is not saved
    mom.qaTasks = mom.qaTasks.filter(
      (q) => q.qaId !== '1' && q.qaName.toLowerCase() !== 'sukanya sharma'
    );
    mom.attendees = mom.attendees.filter(
      (name) => name.toLowerCase() !== 'sukanya sharma'
    );
    localStorage.setItem(`${MOM_STORAGE_KEY_PREFIX}${mom.id}`, JSON.stringify(mom));
  } catch (e) {
    console.error('Error saving MOM to localStorage:', e);
  }
}

export function getStoredQAs(): QA[] {
  let qas = DEFAULT_QAS;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(QAS_STORAGE_KEY);
      if (raw) {
        qas = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading QAs:', e);
    }
  }
  // Ensure Sukanya is excluded
  return qas.filter(
    (q) => q.id !== '1' && q.name.toLowerCase() !== 'sukanya sharma'
  );
}

export function saveStoredQAs(qas: QA[]): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanQAs = qas.filter(
      (q) => q.id !== '1' && q.name.toLowerCase() !== 'sukanya sharma'
    );
    localStorage.setItem(QAS_STORAGE_KEY, JSON.stringify(cleanQAs));
  } catch (e) {
    console.error('Error saving QAs:', e);
  }
}

export function getStoredModules(): ModuleItem[] {
  if (typeof window === 'undefined') return DEFAULT_MODULES;
  try {
    const raw = localStorage.getItem(MODULES_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading Modules:', e);
  }
  return DEFAULT_MODULES;
}

export function saveStoredModules(modules: ModuleItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MODULES_STORAGE_KEY, JSON.stringify(modules));
  } catch (e) {
    console.error('Error saving Modules:', e);
  }
}

export function formatDateString(dateStr: string): string {
  if (!dateStr) return '05-August-2026';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  if (isNaN(dateObj.getTime())) return dateStr;

  const day = String(dateObj.getDate()).padStart(2, '0');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
}
