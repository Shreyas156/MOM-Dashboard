// n8n Webhook / Data Table Integration Helper

const n8nWebhookUrl =
  process.env.N8N_WEBHOOK_URL ||
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
  '';

const n8nApiKey = process.env.N8N_API_KEY || '';

export const isN8nConfigured = Boolean(n8nWebhookUrl);

export async function fetchMOMFromN8n(date: string): Promise<any | null> {
  if (!n8nWebhookUrl) return null;
  try {
    // 1. Try POST request (works even if Webhook node is POST-only in n8n)
    let res = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(n8nApiKey ? { 'X-N8N-API-KEY': n8nApiKey } : {}),
      },
      body: JSON.stringify({
        action: 'get_mom',
        date,
      }),
      cache: 'no-store',
    });

    // 2. Fallback to GET request if POST returns error
    if (!res.ok) {
      res = await fetch(`${n8nWebhookUrl}?action=get_mom&date=${encodeURIComponent(date)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(n8nApiKey ? { 'X-N8N-API-KEY': n8nApiKey } : {}),
        },
        cache: 'no-store',
      });
    }

    if (res.ok) {
      const json = await res.json();
      return json.data || json.mom || json;
    }
  } catch (e) {
    console.error('n8n fetch MOM error:', e);
  }
  return null;
}

export async function saveMOMToN8n(momData: any): Promise<any | null> {
  if (!n8nWebhookUrl) return null;
  try {
    const res = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(n8nApiKey ? { 'X-N8N-API-KEY': n8nApiKey } : {}),
      },
      body: JSON.stringify({
        action: 'save_mom',
        date: momData.id,
        momData,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || json.mom || json;
    }
  } catch (e) {
    console.error('n8n save MOM error:', e);
  }
  return null;
}

export async function fetchSmokeRowsFromN8n(): Promise<any[] | null> {
  if (!n8nWebhookUrl) return null;
  try {
    let res = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(n8nApiKey ? { 'X-N8N-API-KEY': n8nApiKey } : {}),
      },
      body: JSON.stringify({
        action: 'get_smoke',
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      res = await fetch(`${n8nWebhookUrl}?action=get_smoke`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(n8nApiKey ? { 'X-N8N-API-KEY': n8nApiKey } : {}),
        },
        cache: 'no-store',
      });
    }

    if (res.ok) {
      const json = await res.json();
      const rows = json.smokeRows || json.rows || json;
      return Array.isArray(rows) ? rows : null;
    }
  } catch (e) {
    console.error('n8n fetch smoke error:', e);
  }
  return null;
}

export async function saveSmokeRowsToN8n(smokeRows: any[]): Promise<any | null> {
  if (!n8nWebhookUrl) return null;
  try {
    const res = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(n8nApiKey ? { 'X-N8N-API-KEY': n8nApiKey } : {}),
      },
      body: JSON.stringify({
        action: 'save_smoke',
        smokeRows,
        updatedAt: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch (e) {
    console.error('n8n save smoke error:', e);
  }
  return null;
}
